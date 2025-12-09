"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Target, Clock, Trophy, ChevronLeft, Code2, X } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAdmin } from "@/lib/hooks/use-admin";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import { notifyProjectSubmitted } from "@/lib/notifications-helpers";
import type { Mission, MissionContent, MissionProgress, MissionSubmission } from "@/types";
import Image from "next/image";
import LiteIDE from "@/components/lite-ide";

export default function MissionPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.missionId as string;
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [mission, setMission] = useState<Mission | null>(null);
  const [missionContent, setMissionContent] = useState<MissionContent | null>(null);
  const [progress, setProgress] = useState<MissionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [showAdvancedTips, setShowAdvancedTips] = useState(false);
  const [ideOpen, setIdeOpen] = useState(false);
  const [submission, setSubmission] = useState<MissionSubmission | null>(null);
  const [submissionsForReview, setSubmissionsForReview] = useState<MissionSubmission[]>([]);
  const [submissionGitUrl, setSubmissionGitUrl] = useState("");
  const [submissionDirectory, setSubmissionDirectory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    async function loadMission() {
      const supabase = createLearningClient();
      if (!supabase) {
        console.error("Supabase client not configured.");
        setLoading(false);
        return;
      }

      // Fetch mission
      const { data: missionData, error: missionError } = await supabase
        .from("missions")
        .select("*")
        .eq("id", missionId)
        .single();

      if (missionError || !missionData) {
        console.error("Error loading mission:", missionError);
        setLoading(false);
        return;
      }

      // Normalize Supabase payload into Mission type shape
      const normalizedMission: Mission = {
        id: missionData.id,
        lessonId: missionData.lesson_id ?? undefined,
        title: missionData.title,
        goal: missionData.goal,
        description: missionData.description ?? undefined,
        imageUrl: missionData.image_url ?? undefined,
        initialFiles: missionData.initial_files ?? {},
        stackType: missionData.stack_type,
        difficulty: missionData.difficulty,
        estimatedTime: missionData.estimated_time ?? undefined,
        submissionDeadline: missionData.submission_deadline
          ? new Date(missionData.submission_deadline)
          : undefined,
        orderIndex: missionData.order_index,
        badgeId: missionData.badge_id ?? undefined,
      };

      setMission(normalizedMission);
      setFiles(normalizedMission.initialFiles || {});

      // Fetch mission content (optional per mission)
      const { data: contentData } = await supabase
        .from("mission_content")
        .select("*")
        .eq("mission_id", missionId)
        .maybeSingle();

      if (contentData) {
        setMissionContent(contentData as MissionContent);
      }

      // Fetch sandbox, progress, and submission (optional per user/mission)
      if (user) {
        const [sandboxRes, progressRes, submissionRes] = await Promise.all([
          supabase
            .from("sandboxes")
            .select("*")
            .eq("user_id", user.id)
            .eq("mission_id", missionId)
            .maybeSingle(),
          supabase
            .from("mission_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("mission_id", missionId)
            .maybeSingle(),
          supabase
            .from("mission_submissions")
            .select("*")
            .eq("user_id", user.id)
            .eq("mission_id", missionId)
            .maybeSingle(),
        ]);

        if (sandboxRes.data && sandboxRes.data.files) {
          setFiles(sandboxRes.data.files);
        }

        if (progressRes.data) {
          const p = progressRes.data as any;
          setProgress({
            id: p.id,
            userId: p.user_id,
            missionId: p.mission_id,
            completed: p.completed,
            completedAt: p.completed_at ? new Date(p.completed_at) : undefined,
            checklistProgress: p.checklist_progress || [],
            microChecksPassed: p.micro_checks_passed ?? 0,
            totalMicroChecks: p.total_micro_checks ?? 0,
            lastAccessedAt: p.last_accessed_at ? new Date(p.last_accessed_at) : undefined,
          });
        }

        if (submissionRes.data) {
          const s = submissionRes.data as any;
          const mapped: MissionSubmission = {
            id: s.id,
            userId: s.user_id,
            missionId: s.mission_id,
            gitUrl: s.git_url,
            repoDirectory: s.repo_directory ?? undefined,
            status: s.status,
            feedback: s.feedback ?? undefined,
            reviewerId: s.reviewer_id ?? undefined,
            reviewedAt: s.reviewed_at ? new Date(s.reviewed_at) : undefined,
            createdAt: new Date(s.created_at),
            updatedAt: new Date(s.updated_at),
          };
          setSubmission(mapped);
          setSubmissionGitUrl(mapped.gitUrl);
          setSubmissionDirectory(mapped.repoDirectory || "");
        }
      }

      // If admin, load all submissions for this mission for review
      if (isAdmin) {
        const { data: allSubs } = await supabase
          .from("mission_submissions")
          .select("*")
          .eq("mission_id", missionId)
          .order("created_at", { ascending: false });

        if (allSubs) {
          const mapped = allSubs.map((s: any): MissionSubmission => ({
            id: s.id,
            userId: s.user_id,
            missionId: s.mission_id,
            gitUrl: s.git_url,
            repoDirectory: s.repo_directory ?? undefined,
            status: s.status,
            feedback: s.feedback ?? undefined,
            reviewerId: s.reviewer_id ?? undefined,
            reviewedAt: s.reviewed_at ? new Date(s.reviewed_at) : undefined,
            createdAt: new Date(s.created_at),
            updatedAt: new Date(s.updated_at),
          }));
          setSubmissionsForReview(mapped);
        }
      }

      setLoading(false);
    }

    loadMission();
  }, [missionId, user, authLoading, isAdmin]);

  const handleSubmitMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!submissionGitUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = createLearningClient();
      if (!supabase) {
        console.error("Supabase client not configured.");
        setIsSubmitting(false);
        return;
      }
      const { data, error } = await supabase
        .from("mission_submissions")
        .upsert(
          {
            user_id: user.id,
            mission_id: missionId,
            git_url: submissionGitUrl.trim(),
            repo_directory: submissionDirectory.trim() || null,
            status: "under_review",
          },
          {
            onConflict: "user_id,mission_id",
          }
        )
        .select("*")
        .single();

      if (error) {
        console.error("Error submitting mission:", error);
        return;
      }

      const s = data as any;
      const mapped: MissionSubmission = {
        id: s.id,
        userId: s.user_id,
        missionId: s.mission_id,
        gitUrl: s.git_url,
        repoDirectory: s.repo_directory ?? undefined,
        status: s.status,
        feedback: s.feedback ?? undefined,
        reviewerId: s.reviewer_id ?? undefined,
        reviewedAt: s.reviewed_at ? new Date(s.reviewed_at) : undefined,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      };
      setSubmission(mapped);

      // Send notification to user that project was submitted
      if (mission) {
        try {
          const authSupabase = createClient();
          if (!authSupabase) {
            console.warn("Supabase auth client not available for notification");
            return;
          }
          await notifyProjectSubmitted(user.id, missionId, mission.title, authSupabase);
        } catch (notifError) {
          console.error("Error sending submission notification:", notifError);
          // Don't fail the submission if notification fails
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesChange = async (newFiles: Record<string, string>) => {
    setFiles(newFiles);
    
    if (user) {
      const supabase = createLearningClient();
      if (!supabase) return;
      await supabase
        .from("sandboxes")
        .upsert({
          user_id: user.id,
          mission_id: missionId,
          files: newFiles,
        }, {
          onConflict: "user_id,mission_id",
        });
    }
  };

  const handleChecklistToggle = async (index: number) => {
    if (!missionContent || !user) return;

    const checklist = [...(missionContent.checklist || [])];
    checklist[index] = { ...checklist[index], completed: !checklist[index].completed };

    const supabase = createLearningClient();
    if (!supabase) return;
    await supabase
      .from("mission_content")
      .update({ checklist })
      .eq("id", missionContent.id);

    setMissionContent({ ...missionContent, checklist });

    // Update progress
    const completedCount = checklist.filter((item) => item.completed).length;
    await supabase
      .from("mission_progress")
      .upsert({
        user_id: user.id,
        mission_id: missionId,
        checklist_progress: checklist,
        completed: completedCount === checklist.length,
        completed_at: completedCount === checklist.length ? new Date().toISOString() : null,
      }, {
        onConflict: "user_id,mission_id",
      });
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-base text-muted-foreground">Loading mission...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <p className="text-base text-destructive mb-4">Mission not found</p>
        <Link href="/missions">
          <Button variant="outline">
            Back to Missions
          </Button>
        </Link>
      </div>
    );
  }

  const checklist = missionContent?.checklist || [];
  const completedCount = checklist.filter((item) => item.completed).length;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link href="/missions" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Mission Board
        </Link>
      </div>

      {/* Mission Header */}
      <Card className="overflow-hidden mb-8">
        {mission.imageUrl && (
          <div className="relative w-full h-[60vh]">
            <Image
              src={mission.imageUrl}
              alt={mission.title}
              fill
              sizes="100vw"
              loading="eager"
              className="object-contain"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">{mission.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {mission.submissionDeadline
                      ? mission.submissionDeadline.toLocaleDateString()
                      : "No submission date"}
                  </span>
                </div>
                <div className="px-2 py-1 rounded-md bg-muted text-xs">
                  {mission.difficulty}
                </div>
                <div className="px-2 py-1 rounded-md bg-muted text-xs">
                  {mission.stackType}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold text-lg mb-1">Mission Goal:</p>
                <p className="text-foreground">{mission.goal}</p>
              </div>
            </div>
            {progress?.completed && (
              <div className="flex items-center gap-2 text-green-600">
                <Trophy className="h-6 w-6" />
                <span className="font-semibold">Completed!</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lesson Content, Checklist & Submission Road */}
        <div className="lg:col-span-1 space-y-6">
          {missionContent?.markdownContent && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Lesson Content</h2>
              <MarkdownContent content={missionContent.markdownContent} />
            </Card>
          )}

          {checklist.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Checklist</h2>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => user && handleChecklistToggle(index)}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {completedCount} / {checklist.length} completed
              </div>
            </Card>
          )}

          {missionContent?.advancedTips && (
            <Card className="p-6">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedTips(!showAdvancedTips)}
                className="w-full"
              >
                {showAdvancedTips ? "Hide" : "Show"} Advanced Tips
              </Button>
              {showAdvancedTips && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <MarkdownContent content={missionContent.advancedTips} />
                </div>
              )}
            </Card>
          )}

          {/* Submission Roadmap */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Submission Road</h2>
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              {["Submit Project", "Review", "Result"].map((step, index) => {
                const status = submission?.status;
                const isCompleted =
                  status === "approved" ||
                  (status === "under_review" && index <= 1) ||
                  (status === "submitted" && index === 0);
                const isCurrent =
                  (status === "submitted" && index === 0) ||
                  (status === "under_review" && index === 1) ||
                  ((status === "approved" || status === "changes_requested") && index === 2);

                return (
                  <div key={step} className="flex-1 flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-semibold ${
                        isCompleted
                          ? "border-green-500 bg-green-500/10 text-green-600"
                          : isCurrent
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="mt-2 text-center whitespace-nowrap">{step}</div>
                    {index < 2 && (
                      <div className="mt-2 h-px w-full bg-gradient-to-r from-muted via-muted-foreground/40 to-muted" />
                    )}
                  </div>
                );
              })}
            </div>
            {submission?.status === "under_review" && (
              <p className="mt-4 text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                Submission under review. You will get feedback once a mentor or admin has reviewed it.
              </p>
            )}
            {submission?.status === "approved" && (
              <p className="mt-4 text-xs sm:text-sm text-green-600 dark:text-green-400">
                Submission approved! Great work.
              </p>
            )}
            {submission?.status === "changes_requested" && (
              <p className="mt-4 text-xs sm:text-sm text-red-600 dark:text-red-400">
                Changes requested. Please review the feedback and update your project.
              </p>
            )}
          </Card>

          {/* Submission Form */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Mission Submission</h2>
            <form onSubmit={handleSubmitMission} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="git-url">
                  Git Repository URL
                </label>
                <input
                  id="git-url"
                  type="url"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="https://github.com/username/repo"
                  value={submissionGitUrl}
                  onChange={(e) => setSubmissionGitUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="repo-directory">
                  Submit Directory (optional)
                </label>
                <input
                  id="repo-directory"
                  type="text"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. apps/mission-01 (leave empty if root)"
                  value={submissionDirectory}
                  onChange={(e) => setSubmissionDirectory(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || !user}>
                {submission
                  ? isSubmitting
                    ? "Updating submission..."
                    : "Update submission"
                  : isSubmitting
                  ? "Submitting..."
                  : "Submit project for review"}
              </Button>
              {!user && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Please sign in to submit your mission.
                </p>
              )}
            </form>
          </Card>
        </div>

        {/* Right: Coding Playground using Lite IDE (toggleable) */}
        <div className="lg:col-span-2 space-y-4">
          {!ideOpen ? (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIdeOpen(true)}
                className="gap-2"
              >
                <Code2 className="h-4 w-4" />
                Open Lite IDE
              </Button>
            </div>
          ) : (
            <div className="fixed inset-0 z-40 flex items-center justify-center px-3 sm:px-4 md:px-6">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
                onClick={() => setIdeOpen(false)}
              />

              {/* Centered popup */}
              <div className="relative w-full max-w-5xl transform rounded-2xl bg-gradient-to-b from-background/95 to-background/90 shadow-[0_18px_60px_rgba(0,0,0,0.55)] flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 max-h-[85vh] h-[80vh] animate-in fade-in-0 zoom-in-95">
                <div className="flex items-center justify-between pb-1">
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold">
                    Practice in Lite IDE
                  </h2>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setIdeOpen(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close Lite IDE</span>
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <LiteIDE
                    initialFiles={files}
                    missionId={mission.id}
                    lessonTitle={mission.title}
                    lessonContent={missionContent?.markdownContent || ""}
                    onFilesChange={handleFilesChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Admin / Mentor Review Panel */}
          {isAdmin && submissionsForReview.length > 0 && (
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-3">Submissions for Review</h2>
              <div className="space-y-3 max-h-[260px] overflow-y-auto text-sm">
                {submissionsForReview.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-md border border-border p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">
                          User ID: <span className="font-mono">{sub.userId}</span>
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
                          <p className="text-xs text-muted-foreground">
                            Directory: <span className="font-mono">{sub.repoDirectory}</span>
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          sub.status === "approved"
                            ? "bg-green-500/10 text-green-600 border border-green-500/40"
                            : sub.status === "changes_requested"
                            ? "bg-red-500/10 text-red-600 border border-red-500/40"
                            : sub.status === "under_review"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/40"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                    </div>
                    {sub.feedback && (
                      <p className="text-xs text-muted-foreground">
                        Feedback: {sub.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Full review controls (approve / request changes) can be wired here to update
                submission status and feedback.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

