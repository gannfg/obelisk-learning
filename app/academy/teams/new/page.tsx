"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTeam } from "@/lib/teams";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function NewTeamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError("You must be signed in to create a team");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    try {
      const team = await createTeam(
        {
          name,
          description: description || undefined,
        },
        user.id,
        supabase
      );

      if (team) {
        router.push(`/academy/teams/${team.id}`);
      } else {
        setError("Failed to create team. Please try again.");
      }
    } catch (err) {
      console.error("Error creating team:", err);
      setError("An error occurred while creating the team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/academy/teams"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block transition-colors"
        >
          ← Back to Teams
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Team</CardTitle>
            <CardDescription>
              Start a new team and invite members to collaborate on projects
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
                <label htmlFor="name" className="text-sm font-medium">
                  Team Name
                </label>
                <Input id="name" name="name" placeholder="e.g., Web3 Builders" required />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your team's focus and goals..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/academy/teams">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

