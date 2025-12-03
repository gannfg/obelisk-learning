"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAdmin } from "@/lib/hooks/use-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Target } from "lucide-react";

export default function AdminMissionsPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center min-height-[300px]">
          <p className="text-base text-muted-foreground">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const goal = formData.get("goal") as string;
    const description = (formData.get("description") as string) || "";
    const difficulty = formData.get("difficulty") as string;
    const stackType = formData.get("stackType") as string;
    const estimatedTimeRaw = formData.get("estimatedTime") as string;
    const orderIndexRaw = formData.get("orderIndex") as string;

    const estimatedTime = estimatedTimeRaw
      ? Number.parseInt(estimatedTimeRaw, 10)
      : null;
    const orderIndex = orderIndexRaw
      ? Number.parseInt(orderIndexRaw, 10)
      : 0;

    try {
      const { data, error: insertError } = await supabase
        .from("missions")
        .insert({
          title,
          goal,
          description,
          difficulty,
          stack_type: stackType,
          estimated_time: estimatedTime,
          order_index: orderIndex,
          initial_files: {}, // start with empty files; can be edited later via IDE
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating mission:", insertError);
        setError(
          insertError.message ||
            "Failed to create mission. Check RLS policies for missions table."
        );
        setSaving(false);
        return;
      }

      if (data?.id) {
        router.push(`/missions/${data.id}`);
      } else {
        setError("Mission created but no ID returned from Supabase.");
      }
    } catch (err: any) {
      console.error("Unexpected error creating mission:", err);
      setError(
        err?.message || "An unexpected error occurred while creating mission."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
            <Target className="h-7 w-7" />
            <span>Missions Admin</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Create and manage missions that appear on the public Mission Board.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Mission</CardTitle>
          <CardDescription>
            Creates a record in the Supabase <code>missions</code> table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Mission Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Build your first Solana dApp"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="goal" className="text-sm font-medium">
                Short Goal
              </label>
              <Input
                id="goal"
                name="goal"
                placeholder="What is the main outcome of this mission?"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="High-level description of the mission and what learners will do..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select name="difficulty" defaultValue="beginner" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stack</label>
                <Select name="stackType" defaultValue="nextjs" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stack" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nextjs">Next.js</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="solana">Solana</SelectItem>
                    <SelectItem value="node">Node</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="estimatedTime" className="text-sm font-medium">
                  Estimated Time (minutes)
                </label>
                <Input
                  id="estimatedTime"
                  name="estimatedTime"
                  type="number"
                  min={5}
                  step={5}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="orderIndex" className="text-sm font-medium">
                Ordering Index
              </label>
              <Input
                id="orderIndex"
                name="orderIndex"
                type="number"
                min={0}
                step={1}
                placeholder="0 (shown first), 1, 2, ..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Mission"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/missions">View Mission Board</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


