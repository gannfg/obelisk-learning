"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { createLearningClient } from "@/lib/supabase/learning-client";
import type { MissionSubmission } from "@/types";
import { uploadMissionImage } from "@/lib/storage";
import { Loader2, Target } from "lucide-react";

export default function AdminMissionsPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();
  const learningSupabase = createLearningClient();

  // If Supabase clients are not configured, render a fallback message
  if (!supabase || !learningSupabase) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          Supabase environment variables are not configured. Please set NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL, NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY, NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL, and NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY.
        </p>
      </div>
    );
  }

  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
      return;
    }
    if (!loading && isAdmin) {
      loadMissions();
      loadSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAdmin]);

  const loadMissions = async () => {
    setMissionsLoading(true);
    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error loading missions for admin:", error);
      setError(error.message || "Failed to load missions.");
      setMissions([]);
    } else {
      setMissions(data || []);
    }
    setMissionsLoading(false);
  };

  const loadSubmissions = async () => {
    setSubmissionsLoading(true);
    const { data, error } = await learningSupabase
      .from("mission_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading mission submissions for admin:", error);
      setError(error.message || "Failed to load mission submissions.");
      setSubmissions([]);
      setSubmissionsLoading(false);
      return;
    }

    const mapped: MissionSubmission[] =
      (data || []).map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        missionId: s.mission_id,
        gitUrl: s.git_url,
        repoDirectory: s.repo_directory ?? undefined,
        status: s.status,
        feedback: s.feedback ?? undefined,
        reviewerId: s.reviewer_id ?? undefined,
        reviewedAt: s.reviewed_at ? new Date(s.reviewed_at) : undefined,
        isWinner: s.is_winner ?? false,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      })) || [];

    setSubmissions(mapped);
    setSubmissionsLoading(false);
  };

  const missionsById = useMemo(() => {
    const map: Record<string, any> = {};
    missions.forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, [missions]);

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
    const submissionDeadlineRaw = formData.get("submissionDeadline") as string;
    const orderIndexRaw = formData.get("orderIndex") as string;
    const imageFile = formData.get("image") as File | null;

    const submissionDeadline = submissionDeadlineRaw
      ? new Date(submissionDeadlineRaw).toISOString()
      : null;
    const orderIndex = orderIndexRaw
      ? Number.parseInt(orderIndexRaw, 10)
      : 0;

    try {
      let imageUrl: string | null = null;

      if (imageFile && imageFile instanceof File && imageFile.size > 0) {
        imageUrl = await uploadMissionImage(imageFile, null, supabase);
      }

      const { data, error: insertError } = await supabase
        .from("missions")
        .insert({
          title,
          goal,
          description,
          difficulty,
          stack_type: stackType,
          submission_deadline: submissionDeadline,
          order_index: orderIndex,
          image_url: imageUrl,
          initial_files: {}, // start with empty files; can be edited later via IDE
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating mission:", {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        });
        setError(
          insertError.message ||
            "Failed to create mission. Check RLS policies for missions table."
        );
        setSaving(false);
        return;
      }

      if (data?.id) {
        await loadMissions();
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

  const handleDelete = async (id: string) => {
    const mission = missions.find((m) => m.id === id);
    const title = mission?.title || "this mission";

    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);

    const { error } = await supabase.from("missions").delete().eq("id", id);

    if (error) {
      console.error("Error deleting mission:", error);
      setError(error.message || "Failed to delete mission.");
    } else {
      setMissions((prev) => prev.filter((m) => m.id !== id));
    }

    setDeletingId(null);
  };

  const handleUpdateSubmission = async (
    submissionId: string,
    updates: Partial<MissionSubmission>
  ) => {
    setUpdatingSubmissionId(submissionId);
    setError(null);

    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (typeof updates.isWinner === "boolean") payload.is_winner = updates.isWinner;
    if (typeof updates.feedback === "string") payload.feedback = updates.feedback;

    const { error } = await learningSupabase
      .from("mission_submissions")
      .update(payload)
      .eq("id", submissionId);

    if (error) {
      console.error("Error updating submission:", error);
      setError(error.message || "Failed to update submission.");
    } else {
      await loadSubmissions();
    }

    setUpdatingSubmissionId(null);
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
                <label htmlFor="submissionDeadline" className="text-sm font-medium">
                  Submission Date
                </label>
                <Input
                  id="submissionDeadline"
                  name="submissionDeadline"
                  type="date"
                  placeholder="Select submission date"
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

            <div className="space-y-2">
              <label htmlFor="image" className="text-sm font-medium">
                Mission Image (optional)
              </label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
              />
              <p className="text-xs text-muted-foreground">
                This image will be used as the mission thumbnail on the Mission Board.
              </p>
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

      {/* Existing missions list */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Missions</CardTitle>
          <CardDescription>
            Manage missions currently available on the Mission Board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {missionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading missions...</p>
          ) : missions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No missions created yet.</p>
          ) : (
            <div className="space-y-2">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{mission.title}</p>
                    <p className="text-xs text-muted-foreground flex gap-2">
                      <span>{mission.difficulty}</span>
                      <span>•</span>
                      <span>{mission.stack_type}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/missions/${mission.id}`}>View</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-600 hover:bg-red-500/10"
                      onClick={() => handleDelete(mission.id)}
                      disabled={deletingId === mission.id}
                    >
                      {deletingId === mission.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mission submissions manager */}
      <Card>
        <CardHeader>
          <CardTitle>Mission Submissions Manager</CardTitle>
          <CardDescription>
            Review mission submissions, update status, and mark winners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No mission submissions yet. Learners can submit from the mission page.
            </p>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {submissions.map((sub) => {
                const mission = missionsById[sub.missionId];
                return (
                  <div
                    key={sub.id}
                    className="rounded-md border border-border p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {mission?.title || "Unknown mission"}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({sub.missionId})
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          User: <span className="font-mono">{sub.userId}</span>
                        </p>
                        <a
                          href={sub.gitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline break-all"
                        >
                          {sub.gitUrl}
                        </a>
                        {sub.repoDirectory && (
                          <p className="text-[11px] text-muted-foreground">
                            Directory: <span className="font-mono">{sub.repoDirectory}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <select
                          className="rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                          value={sub.status}
                          onChange={(e) =>
                            handleUpdateSubmission(sub.id, {
                              status: e.target.value as MissionSubmission["status"],
                            })
                          }
                          disabled={updatingSubmissionId === sub.id}
                        >
                          <option value="submitted">Submitted</option>
                          <option value="under_review">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="changes_requested">Changes Requested</option>
                        </select>
                        <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={Boolean(sub.isWinner)}
                            onChange={(e) =>
                              handleUpdateSubmission(sub.id, { isWinner: e.target.checked })
                            }
                            disabled={updatingSubmissionId === sub.id}
                          />
                          Mark as winner
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {sub.feedback && (
                        <p className="text-xs text-muted-foreground">
                          Feedback: {sub.feedback}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Submitted: {sub.createdAt.toLocaleString()}
                        {sub.reviewedAt && ` • Reviewed: ${sub.reviewedAt.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


