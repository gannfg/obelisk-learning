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
import { createLearningClient } from "@/lib/supabase/learning-client";
import { Loader2 } from "lucide-react";

export default function AdminCoursesPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    // Create Supabase client only on the client when form is submitted.
    // This avoids throwing during build/prerender if env vars are missing.
    let supabase;
    try {
      supabase = createLearningClient();
    } catch (err: any) {
      console.error("Supabase client not configured:", err);
      setError(
        err?.message ||
          "Supabase environment variables are not configured. Please set NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL and NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY."
      );
      setSaving(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const thumbnail = (formData.get("thumbnail") as string) || "";

    try {
      // Ensure there is a single virtual instructor representing DeMentor (AI)
      // If it doesn't exist, create it once and reuse it for all courses.
      const { data: existing, error: loadInstructorError } = await supabase
        .from("instructors")
        .select("id")
        .eq("name", "DeMentor")
        .limit(1);

      if (loadInstructorError) {
        console.error("Error loading DeMentor instructor:", loadInstructorError);
        setError(
          loadInstructorError.message ||
            "Failed to load DeMentor instructor. Check instructors table permissions."
        );
        setSaving(false);
        return;
      }

      let instructorId = existing?.[0]?.id as string | undefined;

      if (!instructorId) {
        const { data: created, error: createInstructorError } = await supabase
          .from("instructors")
          .insert({
            name: "DeMentor",
            avatar: "https://placehold.co/128x128?text=DeMentor",
            bio: "DeMentor is your AI-native coding mentor for Web3, Solana, and modern fullstack development.",
            specializations: ["Web3", "Solana", "Fullstack"],
            socials: {
              twitter: "@DeMentorAI",
              website: "https://superteam.fun",
            },
          })
          .select("id")
          .single();

        if (createInstructorError || !created) {
          console.error(
            "Error creating DeMentor instructor:",
            createInstructorError
          );
          setError(
            createInstructorError?.message ||
              "Failed to create DeMentor instructor. Check instructors table permissions."
          );
          setSaving(false);
          return;
        }

        instructorId = created.id;
      }

      const { data, error: insertError } = await supabase
        .from("courses")
        .insert({
          title,
          description,
          thumbnail: thumbnail || "https://placehold.co/600x400?text=Course",
          instructor_id: instructorId,
          category,
          featured: false,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating course:", insertError);
        setError(
          insertError.message ||
            "Failed to create course. Check RLS policies for courses table."
        );
        setSaving(false);
        return;
      }

      if (data?.id) {
        // Redirect to public academy course detail page (still using mock data)
        router.push(`/academy/courses/${data.id}`);
      } else {
        setError("Course created but no ID returned from Supabase.");
      }
    } catch (err: any) {
      console.error("Unexpected error creating course:", err);
      setError(
        err?.message || "An unexpected error occurred while creating course."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Courses Admin</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Create and manage courses for the Web3 Coding Academy.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
          <CardDescription>
            Creates a record in the Supabase <code>courses</code> table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Course Title
              </label>
              <Input id="title" name="title" placeholder="e.g., Solana Development Bootcamp" required />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what this course will teach..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Videography / Photography">Videography / Photography</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Solana Integration">Solana Integration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="thumbnail" className="text-sm font-medium">
                Thumbnail URL
              </label>
              <Input id="thumbnail" name="thumbnail" placeholder="https://..." />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Course"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/academy?tab=courses">View Courses</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


