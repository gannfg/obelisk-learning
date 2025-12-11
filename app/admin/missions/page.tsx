"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { createLearningClient } from "@/lib/supabase/learning-client";
import type { MissionSubmission } from "@/types";
import { uploadMissionImage } from "@/lib/storage";
import { COURSE_CATEGORIES } from "@/lib/categories";
import { Loader2, Target, Plus, Calendar, Pencil } from "lucide-react";
import { ImageCropper } from "@/components/image-cropper";
import { notifySubmissionFeedback, notifyProjectReviewed } from "@/lib/notifications-helpers";

export default function AdminMissionsPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const [missionDialogError, setMissionDialogError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  // Mission form state
  const [missionForm, setMissionForm] = useState({
    title: "",
    goal: "",
    description: "",
    category: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    stackType: "none" as "none" | "nextjs" | "react" | "solana" | "node" | "python" | "other",
    submissionDeadline: "",
    endDate: "",
    submissionFields: [
      { type: "git", label: "Git Repository URL", required: true, placeholder: "https://github.com/username/repo", helper: "" },
      { type: "website", label: "Website URL", required: true, placeholder: "https://your-project.com", helper: "URL of your deployed website or web application" }
    ] as Array<{ type: string; label: string; required: boolean; placeholder: string; helper?: string }>,
  });
  
  const supabase = createClient();
  const learningSupabase = createLearningClient();

  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, { email?: string; username?: string }>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

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
    if (!supabase) {
      setError("Supabase client not configured.");
      setMissionsLoading(false);
      return;
    }
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
    if (!learningSupabase) {
      setError("Learning Supabase client not configured.");
      setSubmissionsLoading(false);
      return;
    }
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
        websiteUrl: s.website_url ?? undefined,
        pitchDeckUrl: s.pitch_deck_url ?? undefined,
        status: s.status,
        feedback: s.feedback ?? undefined,
        reviewerId: s.reviewer_id ?? undefined,
        reviewedAt: s.reviewed_at ? new Date(s.reviewed_at) : undefined,
        isWinner: s.is_winner ?? false,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      })) || [];

    setSubmissions(mapped);
    // Seed feedback drafts
    const drafts: Record<string, string> = {};
    mapped.forEach((m) => {
      drafts[m.id] = m.feedback || "";
    });
    setFeedbackDrafts(drafts);
    // Load user profile info for admin display (best-effort)
    try {
      const userIds = Array.from(new Set(mapped.map((m) => m.userId)));
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await learningSupabase
          .from("users")
          .select("id,email,username")
          .in("id", userIds);

        if (!usersError && usersData) {
          const profiles: Record<string, { email?: string; username?: string }> = {};
          usersData.forEach((u: any) => {
            profiles[u.id] = { email: u.email ?? undefined, username: u.username ?? undefined };
          });
          setUserProfiles(profiles);
        }
      }
    } catch (profileErr) {
      console.warn("Unable to load user profiles for submissions", profileErr);
    }
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-height-[300px]">
          <p className="text-base text-muted-foreground">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  const resetMissionForm = () => {
    setMissionDialogError(null);
    setEditingMissionId(null);
    setMissionForm({
      title: "",
      goal: "",
      description: "",
      category: "",
      difficulty: "beginner",
      stackType: "none",
      submissionDeadline: "",
      endDate: "",
      submissionFields: [
        { type: "git", label: "Git Repository URL", required: true, placeholder: "https://github.com/username/repo", helper: "" },
        { type: "website", label: "Website URL", required: true, placeholder: "https://your-project.com", helper: "URL of your deployed website or web application" }
      ],
    });
    setImageFile(null);
    setImagePreview(null);
    setImageToCrop(null);
  };

  const openEditDialog = (mission: any) => {
    setEditingMissionId(mission.id);
    setMissionForm({
      title: mission.title || "",
      goal: mission.goal || "",
      description: mission.description || "",
      category: mission.category || "",
      difficulty: mission.difficulty || "beginner",
      stackType: mission.stack_type || "none",
      submissionDeadline: mission.submission_deadline
        ? new Date(mission.submission_deadline).toISOString().split("T")[0]
        : "",
      endDate: mission.end_date
        ? new Date(mission.end_date).toISOString().split("T")[0]
        : "",
      submissionFields: mission.submission_fields && Array.isArray(mission.submission_fields) && mission.submission_fields.length > 0
        ? mission.submission_fields
        : [
            { type: "git", label: "Git Repository URL", required: true, placeholder: "https://github.com/username/repo", helper: "" },
            { type: "website", label: "Website URL", required: true, placeholder: "https://your-project.com", helper: "URL of your deployed website or web application" }
          ],
    });
    setImagePreview(mission.image_url || null);
    setImageFile(null);
    setImageToCrop(mission.image_url || null);
    setShowImageCropper(false);
    setMissionDialogError(null);
    setMissionDialogOpen(true);
  };

  const handleCreateMission = async () => {
    if (!missionForm.title || !missionForm.goal) {
      setMissionDialogError("Title and Goal are required.");
      return;
    }

    setSaving(true);
    setMissionDialogError(null);

    const submissionDeadlineISO = missionForm.submissionDeadline
      ? new Date(missionForm.submissionDeadline).toISOString()
      : null;
    const endDateISO = missionForm.endDate
      ? new Date(missionForm.endDate).toISOString()
      : null;

    if (!supabase) {
      setMissionDialogError("Supabase client not configured.");
      setSaving(false);
      return;
    }

    try {
      let imageUrl: string | undefined = undefined;

      // Upload new image if provided
      if (imageFile && imageFile instanceof File && imageFile.size > 0) {
        try {
          const uploadedUrl = await uploadMissionImage(imageFile, editingMissionId || null, supabase);
          if (!uploadedUrl) {
            setMissionDialogError("Failed to upload mission image. Please try again.");
            setSaving(false);
            return;
          }
          imageUrl = uploadedUrl;
        } catch (uploadError: any) {
          console.error("Error uploading mission image:", uploadError);
          setMissionDialogError(
            uploadError?.message || "Failed to upload mission image. Please try again with a different image."
          );
          setSaving(false);
          return;
        }
      }

      // Build payload, only including fields that exist in the schema
      const payload: any = {
        title: missionForm.title,
        goal: missionForm.goal,
        description: missionForm.description || "",
        difficulty: missionForm.difficulty,
        stack_type: missionForm.stackType === "none" ? undefined : missionForm.stackType,
        submission_deadline: submissionDeadlineISO,
        submission_fields: missionForm.submissionFields,
      };

      // Only add category and end_date if they have values (columns may not exist in older schemas)
      if (missionForm.category) {
        payload.category = missionForm.category;
      }
      if (endDateISO) {
        payload.end_date = endDateISO;
      }

      // Include image_url only if a new image was uploaded
      // When editing, if no new image is uploaded, the existing image_url is preserved automatically
      if (imageUrl !== undefined) {
        payload.image_url = imageUrl;
      }

      if (editingMissionId) {
        // Update existing mission
        const { data, error: updateError } = await supabase
          .from("missions")
          .update(payload)
          .eq("id", editingMissionId)
          .select("id")
          .single();

        if (updateError) {
          console.error("Error updating mission:", {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
          });
          const errorMessage = updateError.message || 
            updateError.hint || 
            updateError.details || 
            "Failed to update mission. Check RLS policies for missions table.";
          setMissionDialogError(errorMessage);
          setSaving(false);
          return;
        }

        if (data?.id) {
          setMissionDialogOpen(false);
          resetMissionForm();
          await loadMissions();
        } else {
          setMissionDialogError("Mission updated but no ID returned from Supabase.");
        }
      } else {
        // Create new mission
        // Use the current number of missions as the order index (new missions appear at the end)
        const orderIndex = missions.length;
        payload.order_index = orderIndex;
        payload.initial_files = {}; // start with empty files; can be edited later via IDE

        const { data, error: insertError } = await supabase
          .from("missions")
          .insert(payload)
          .select("id")
          .single();

        if (insertError) {
          console.error("Error creating mission:", {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
          });
          const errorMessage = insertError.message || 
            insertError.hint || 
            insertError.details || 
            "Failed to create mission. Check RLS policies for missions table.";
          setMissionDialogError(errorMessage);
          setSaving(false);
          return;
        }

        if (data?.id) {
          setMissionDialogOpen(false);
          resetMissionForm();
          await loadMissions();
          router.push(`/missions/${data.id}`);
        } else {
          setMissionDialogError("Mission created but no ID returned from Supabase.");
        }
      }
    } catch (err: any) {
      console.error("Unexpected error saving mission:", err);
      const errorMessage = err?.message || 
        err?.toString() || 
        `An unexpected error occurred while ${editingMissionId ? "updating" : "creating"} mission.`;
      setMissionDialogError(errorMessage);
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const mission = missions.find((m) => m.id === id);
    const title = mission?.title || "this mission";

    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    if (!supabase) {
      setError("Supabase client not configured.");
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

  // Helper function to calculate progress percentage based on submission status
  const getProgressPercentage = (status: MissionSubmission["status"] | undefined): number => {
    if (!status) return 0;
    switch (status) {
      case "submitted":
        return 50;
      case "under_review":
        return 75;
      case "approved":
        return 100;
      case "changes_requested":
        return 75;
      default:
        return 0;
    }
  };

  const handleUpdateSubmission = async (
    submissionId: string,
    updates: Partial<MissionSubmission>
  ) => {
    if (!learningSupabase) {
      setError("Learning Supabase client not configured.");
      return;
    }

    setUpdatingSubmissionId(submissionId);
    setError(null);

    // Get submission details before updating
    const submission = submissions.find((s) => s.id === submissionId);
    if (!submission) {
      setError("Submission not found");
      setUpdatingSubmissionId(null);
      return;
    }

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
      // Update mission progress when status changes — only if admin is the same user (RLS-safe)
      if (updates.status) {
        try {
          const currentUser = await supabase?.auth.getUser();
          const currentUserId = currentUser?.data?.user?.id;

          // RLS on mission_progress only allows auth.uid() = user_id.
          // If admin is updating another user's submission, skip the progress update to avoid errors.
          if (currentUserId && currentUserId === submission.userId) {
            const newStatus = updates.status;
            const { error: progressError } = await learningSupabase
              .from("mission_progress")
              .upsert(
                {
                  user_id: submission.userId,
                  mission_id: submission.missionId,
                  completed: newStatus === "approved",
                  completed_at: newStatus === "approved"
                    ? new Date().toISOString()
                    : null,
                },
                {
                  onConflict: "user_id,mission_id",
                }
              );

            if (progressError) {
              // Keep noisy errors out of console; log a concise warning for admins.
              console.warn("Progress update skipped (RLS or other issue)", {
                status: newStatus,
                missionId: submission.missionId,
                userId: submission.userId,
                error: progressError.message,
              });
            }
          }
        } catch (progressCatchError) {
          console.warn("Progress update skipped due to auth lookup failure", progressCatchError);
        }
      }

      await loadSubmissions();

      // Send notification to submitter if feedback or status was updated
      if (updates.feedback || updates.status) {
        try {
          // Get reviewer name (current user)
          if (!supabase) {
            console.warn("Supabase auth client not available for notification");
            return;
          }
          const { data: userData } = await supabase.auth.getUser();
          const reviewerName = userData?.user?.email?.split("@")[0] || "Admin";

          // Get mission title for notification
          const mission = missions.find((m) => m.id === submission.missionId);
          const missionTitle = mission?.title || "mission";

          // Send project reviewed notification if status is approved or changes_requested
          if (updates.status === "approved" || updates.status === "changes_requested") {
            await notifyProjectReviewed(
              submission.userId,
              submission.missionId,
              missionTitle,
              updates.status,
              reviewerName,
              updates.feedback || null,
              supabase
            );
          } else {
            // For other status updates, use the generic submission feedback notification
            await notifySubmissionFeedback(
              submission.userId,
              submissionId,
              missionTitle,
              reviewerName,
              updates.feedback || null,
              supabase
            );
          }
        } catch (notifError) {
          console.error("Error sending notification:", notifError);
          // Don't fail the update if notification fails
        }
      }
    }

    setUpdatingSubmissionId(null);
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-8">
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Missions</CardTitle>
              <CardDescription>
                Create and manage missions that appear on the public Mission Board.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetMissionForm();
                setMissionDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Mission
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}
          
          {/* Existing missions list */}
          {missionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading missions...</p>
          ) : missions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No missions created yet. Click "New Mission" to create one.</p>
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
                      onClick={() => openEditDialog(mission)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
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

      {/* Create Mission Dialog */}
      <Dialog open={missionDialogOpen} onOpenChange={(open) => {
        setMissionDialogOpen(open);
        if (!open) {
          setMissionDialogError(null);
          resetMissionForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMissionId ? "Edit Mission" : "Create New Mission"}</DialogTitle>
            <DialogDescription>
              {editingMissionId 
                ? "Update mission details that appear on the public Mission Board."
                : "Create a new mission that will appear on the public Mission Board."}
            </DialogDescription>
          </DialogHeader>
          {missionDialogError && (
            <div 
              className="p-4 rounded-md bg-red-500/20 dark:bg-red-500/30 border-2 border-red-500 dark:border-red-400 animate-in fade-in-0 slide-in-from-top-2"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1.5">Error Creating Mission</p>
                  <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{missionDialogError}</p>
                </div>
                <button
                  onClick={() => setMissionDialogError(null)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex-shrink-0"
                  aria-label="Dismiss error"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                Mission Title <span className="text-destructive">*</span>
                {!missionForm.title && (
                  <span className="text-xs text-destructive ml-1">(Required)</span>
                )}
              </label>
              <Input
                value={missionForm.title}
                onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                placeholder="e.g., Build your first Solana dApp"
                className={!missionForm.title ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                Short Goal <span className="text-destructive">*</span>
                {!missionForm.goal && (
                  <span className="text-xs text-destructive ml-1">(Required)</span>
                )}
              </label>
              <Input
                value={missionForm.goal}
                onChange={(e) => setMissionForm({ ...missionForm, goal: e.target.value })}
                placeholder="What is the main outcome of this mission?"
                className={!missionForm.goal ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={missionForm.description}
                onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                placeholder="High-level description of the mission and what learners will do..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={missionForm.category}
                onValueChange={(value) => setMissionForm({ ...missionForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  value={missionForm.difficulty}
                  onValueChange={(value: "beginner" | "intermediate" | "advanced") =>
                    setMissionForm({ ...missionForm, difficulty: value })
                  }
                >
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

              <div>
                <label className="text-sm font-medium">Stack</label>
                <Select
                  value={missionForm.stackType}
                  onValueChange={(value: "none" | "nextjs" | "react" | "solana" | "node" | "python" | "other") =>
                    setMissionForm({ ...missionForm, stackType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stack" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="nextjs">Next.js</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="solana">Solana</SelectItem>
                    <SelectItem value="node">Node</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Submission Date</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={missionForm.submissionDeadline}
                    onChange={(e) => setMissionForm({ ...missionForm, submissionDeadline: e.target.value })}
                    className="pr-10"
                  />
                  <Calendar 
                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" 
                    onClick={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input) {
                        if (typeof input.showPicker === 'function') {
                          input.showPicker();
                        } else {
                          input.click();
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">End Date</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={missionForm.endDate}
                    onChange={(e) => setMissionForm({ ...missionForm, endDate: e.target.value })}
                    className="pr-10"
                  />
                  <Calendar 
                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" 
                    onClick={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input) {
                        if (typeof input.showPicker === 'function') {
                          input.showPicker();
                        } else {
                          input.click();
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Submission Fields Configuration */}
            <div>
              <label className="text-sm font-medium mb-2 block">Submission Fields</label>
              <p className="text-xs text-muted-foreground mb-3">
                Configure what fields users need to fill when submitting this mission. You can choose from predefined types or create custom fields.
              </p>
              <div className="space-y-3">
                {missionForm.submissionFields.map((field, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Field {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newFields = missionForm.submissionFields.filter((_, i) => i !== index);
                          setMissionForm({ ...missionForm, submissionFields: newFields });
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Type</label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => {
                            const newFields = [...missionForm.submissionFields];
                            newFields[index] = { ...field, type: value };
                            setMissionForm({ ...missionForm, submissionFields: newFields });
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="git">Git Repository</SelectItem>
                            <SelectItem value="website">Website URL</SelectItem>
                            <SelectItem value="video">Video Link</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => {
                              const newFields = [...missionForm.submissionFields];
                              newFields[index] = { ...field, required: e.target.checked };
                              setMissionForm({ ...missionForm, submissionFields: newFields });
                            }}
                            className="rounded"
                          />
                          Required
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Label</label>
                      <Input
                        value={field.label}
                        onChange={(e) => {
                          const newFields = [...missionForm.submissionFields];
                          newFields[index] = { ...field, label: e.target.value };
                          setMissionForm({ ...missionForm, submissionFields: newFields });
                        }}
                        placeholder="e.g., Video Link"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Placeholder</label>
                      <Input
                        value={field.placeholder}
                        onChange={(e) => {
                          const newFields = [...missionForm.submissionFields];
                          newFields[index] = { ...field, placeholder: e.target.value };
                          setMissionForm({ ...missionForm, submissionFields: newFields });
                        }}
                        placeholder="e.g., https://youtube.com/watch?v=..."
                        className="h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Helper Text (optional)</label>
                      <Input
                        value={field.helper || ""}
                        onChange={(e) => {
                          const newFields = [...missionForm.submissionFields];
                          newFields[index] = { ...field, helper: e.target.value };
                          setMissionForm({ ...missionForm, submissionFields: newFields });
                        }}
                        placeholder="Additional instructions for users"
                        className="h-8"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMissionForm({
                      ...missionForm,
                      submissionFields: [
                        ...missionForm.submissionFields,
                        { type: "custom", label: "", required: false, placeholder: "", helper: "" }
                      ]
                    });
                  }}
                  className="w-full"
                >
                  + Add Field
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Mission Image (optional)</label>
              {imagePreview && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2 border group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImageToCrop(imagePreview);
                        setShowImageCropper(true);
                      }}
                    >
                      Adjust Image
                    </Button>
                  </div>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Check file size (5MB limit)
                    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                    if (file.size > maxSize) {
                      setMissionDialogError(`Image size exceeds the maximum limit of 5MB. Please use a smaller image. (Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
                      e.target.value = ""; // Clear the input
                      setImageFile(null);
                      setImagePreview(null);
                      setImageToCrop(null);
                      return;
                    }
                    const imageUrl = URL.createObjectURL(file);
                    setImageFile(file);
                    setImagePreview(imageUrl);
                    setImageToCrop(imageUrl);
                    setShowImageCropper(true);
                    setMissionDialogError(null); // Clear any previous errors
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This image will be used as the mission thumbnail on the Mission Board. Maximum file size: 5MB. Click "Adjust Image" to crop and rotate.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMissionDialogOpen(false);
              setMissionDialogError(null);
              resetMissionForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateMission} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingMissionId ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingMissionId ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      {imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          open={showImageCropper}
          onClose={() => {
            setShowImageCropper(false);
            // If user cancels cropping and there's no existing preview, clear the image
            if (!imagePreview && !editingMissionId) {
              setImageFile(null);
              setImageToCrop(null);
            }
          }}
          onCropComplete={(croppedBlob) => {
            // Convert blob to file
            const croppedFile = new File([croppedBlob], "mission-image.jpg", {
              type: "image/jpeg",
            });
            setImageFile(croppedFile);
            setImagePreview(URL.createObjectURL(croppedBlob));
            setShowImageCropper(false);
          }}
          aspectRatio={1}
        />
      )}

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
                        {(() => {
                          const profile = userProfiles[sub.userId];
                          const label =
                            profile?.username ||
                            profile?.email ||
                            sub.userId;
                          return (
                            <p className="text-[11px] text-muted-foreground">
                              User: <span className="font-mono break-all">{label}</span>
                              {profile?.email && profile?.username
                                ? ` (${profile.email})`
                                : profile?.email && profile?.email !== label
                                ? ` (${profile.email})`
                                : null}
                            </p>
                          );
                        })()}
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
                        {sub.websiteUrl && (
                          <div className="mt-1">
                            <p className="text-[11px] text-muted-foreground">Website:</p>
                            <a
                              href={sub.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline break-all"
                            >
                              {sub.websiteUrl}
                            </a>
                          </div>
                        )}
                        {sub.pitchDeckUrl && (
                          <div className="mt-1">
                            <p className="text-[11px] text-muted-foreground">Pitch Deck:</p>
                            <a
                              href={sub.pitchDeckUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline break-all"
                            >
                              {sub.pitchDeckUrl}
                            </a>
                          </div>
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
                    <div className="space-y-2">
                      {/* Progress Display */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-muted-foreground">Progress:</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              getProgressPercentage(sub.status) === 100
                                ? "bg-green-500"
                                : getProgressPercentage(sub.status) >= 50
                                ? "bg-blue-500"
                                : "bg-primary"
                            }`}
                            style={{ width: `${getProgressPercentage(sub.status)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground min-w-[3rem] text-right">
                          {getProgressPercentage(sub.status)}%
                        </span>
                      </div>

                      {/* Admin note / feedback */}
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Admin note (visible to user):</label>
                        <textarea
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                          rows={2}
                          value={feedbackDrafts[sub.id] ?? ""}
                          onChange={(e) =>
                            setFeedbackDrafts((prev) => ({
                              ...prev,
                              [sub.id]: e.target.value,
                            }))
                          }
                          disabled={updatingSubmissionId === sub.id}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateSubmission(sub.id, { feedback: feedbackDrafts[sub.id] ?? "" })
                            }
                            disabled={updatingSubmissionId === sub.id}
                          >
                            Save note
                          </Button>
                        </div>
                        {sub.feedback && (
                          <p className="text-xs text-muted-foreground">
                            Current note: {sub.feedback}
                          </p>
                        )}
                      </div>

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


