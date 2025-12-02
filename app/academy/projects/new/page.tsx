"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProject } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError("You must be signed in to create a project");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const difficulty = formData.get("difficulty") as "beginner" | "intermediate" | "advanced";
    const tagsInput = formData.get("tags") as string;
    const tags = tagsInput
      ? tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

    try {
      const project = await createProject(
        {
          title,
          description,
          status: "planning",
          difficulty,
          tags,
        },
        user.id,
        supabase
      );

      if (project) {
        router.push(`/academy/projects/${project.id}`);
      } else {
        setError("Failed to create project. Please try again.");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      setError("An error occurred while creating the project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/academy/projects"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block transition-colors"
        >
          ← Back to Projects
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>
              Start a new Web3 project and invite team members to collaborate
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
                  Project Title
                </label>
                <Input id="title" name="title" placeholder="e.g., DeFi Trading Platform" required />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your project..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium">
                  Difficulty Level
                </label>
                <Select name="difficulty" required>
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
                <label htmlFor="tags" className="text-sm font-medium">
                  Tags (comma-separated)
                </label>
                <Input id="tags" name="tags" placeholder="e.g., Solana, DeFi, Web3" />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/academy/projects">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

