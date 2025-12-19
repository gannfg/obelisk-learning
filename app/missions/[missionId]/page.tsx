"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CheckCircle2, Circle, Target, Clock, Trophy, ChevronLeft, Code2, X, Calendar, BookOpen, ArrowLeft, UserPlus, Loader2, Lock } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAdmin } from "@/lib/hooks/use-admin";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import { notifyProjectSubmitted } from "@/lib/notifications-helpers";
import type { Mission, MissionContent, MissionProgress, MissionSubmission } from "@/types";
import { canAccessMission, getMissionPrerequisitesWithDetails } from "@/lib/mission-prerequisites";
import Image from "next/image";

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
  const [submission, setSubmission] = useState<MissionSubmission | null>(null);
  const [submissionsForReview, setSubmissionsForReview] = useState<MissionSubmission[]>([]);
  const [submissionGitUrl, setSubmissionGitUrl] = useState("");
  const [submissionWebsiteUrl, setSubmissionWebsiteUrl] = useState("");
  const [submissionPitchDeckUrl, setSubmissionPitchDeckUrl] = useState("");
  const [submissionFieldValues, setSubmissionFieldValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "checklist" | "submission">("overview");
  const [canAccess, setCanAccess] = useState<{ canAccess: boolean; missingClasses: string[] } | null>(null);
  const [prerequisiteDetails, setPrerequisiteDetails] = useState<Array<{ id: string; title: string; thumbnail?: string }>>([]);

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
        endDate: missionData.end_date
          ? new Date(missionData.end_date)
          : undefined,
        category: missionData.category ?? undefined,
        orderIndex: missionData.order_index,
        badgeId: missionData.badge_id ?? undefined,
        submissionFields: missionData.submission_fields ?? undefined,
      };

      setMission(normalizedMission);
      setFiles(normalizedMission.initialFiles || {});

      // Check prerequisites and access
      if (user) {
        const access = await canAccessMission(missionId, user.id, supabase);
        setCanAccess(access);
        const prerequisites = await getMissionPrerequisitesWithDetails(missionId, supabase);
        setPrerequisiteDetails(prerequisites);
      } else {
        // For non-authenticated users, check prerequisites
        const prerequisites = await getMissionPrerequisitesWithDetails(missionId, supabase);
        setPrerequisiteDetails(prerequisites);
        setCanAccess({
          canAccess: prerequisites.length === 0,
          missingClasses: prerequisites.map(p => p.id),
        });
      }

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
          // If user has progress but no submission yet, default to submission tab
          if (!submissionRes.data) {
            setActiveTab("submission");
          }
        }

        if (submissionRes.data) {
          const s = submissionRes.data as any;
          const mapped: MissionSubmission = {
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
            createdAt: new Date(s.created_at),
            updatedAt: new Date(s.updated_at),
          };
          setSubmission(mapped);
          setSubmissionGitUrl(mapped.gitUrl);
          setSubmissionWebsiteUrl(mapped.websiteUrl || "");
          setSubmissionPitchDeckUrl(mapped.pitchDeckUrl || "");
          
          // Populate submission field values
          const fieldValues: Record<string, string> = {};
          if (mapped.gitUrl) fieldValues.git = mapped.gitUrl;
          if (mapped.websiteUrl) fieldValues.website = mapped.websiteUrl;
          if (s.video_url) fieldValues.video = s.video_url;
          if (s.custom_fields && typeof s.custom_fields === 'object') {
            Object.assign(fieldValues, s.custom_fields);
          }
          setSubmissionFieldValues(fieldValues);
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
            websiteUrl: s.website_url ?? undefined,
            pitchDeckUrl: s.pitch_deck_url ?? undefined,
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

    // Validate required fields based on mission submission_fields
    const submissionFields = mission?.submissionFields || [
      { type: "git", label: "Git Repository URL", required: true, placeholder: "", helper: "" },
      { type: "website", label: "Website URL", required: true, placeholder: "", helper: "" }
    ];

    // Check required fields
    for (const field of submissionFields) {
      if (field.required) {
        const fieldKey = field.type === "git" ? "git" : field.type === "website" ? "website" : field.type;
        const value = submissionFieldValues[fieldKey] || 
          (field.type === "git" ? submissionGitUrl : field.type === "website" ? submissionWebsiteUrl : "");
        if (!value.trim()) {
          alert(`Please fill in ${field.label}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const supabase = createLearningClient();
      if (!supabase) {
        console.error("Supabase client not configured.");
        setIsSubmitting(false);
        return;
      }
      const payload: any = {
        user_id: user.id,
        mission_id: missionId,
        status: "submitted", // Set to "submitted" first (50% progress)
      };

      // Map submission fields to payload
      for (const field of submissionFields) {
        const fieldKey = field.type === "git" ? "git" : field.type === "website" ? "website" : field.type;
        const value = submissionFieldValues[fieldKey] || 
          (field.type === "git" ? submissionGitUrl : field.type === "website" ? submissionWebsiteUrl : "");
        
        if (value.trim()) {
          if (field.type === "git") {
            payload.git_url = value.trim();
          } else if (field.type === "website") {
            payload.website_url = value.trim();
          } else if (field.type === "video") {
            payload.video_url = value.trim();
          } else {
            // For custom fields, store in a JSONB field or use a generic field
            if (!payload.custom_fields) payload.custom_fields = {};
            payload.custom_fields[field.type] = value.trim();
          }
        }
      }

      // Legacy support: keep old fields for backward compatibility
      if (submissionGitUrl.trim() && !payload.git_url) {
        payload.git_url = submissionGitUrl.trim();
      }
      if (submissionWebsiteUrl.trim() && !payload.website_url) {
        payload.website_url = submissionWebsiteUrl.trim();
      }

      // Add Developer-specific fields if mission category is Developer
      if (mission?.category === "Developer") {
        if (submissionPitchDeckUrl.trim()) {
          payload.pitch_deck_url = submissionPitchDeckUrl.trim();
        }
      }

      const { data, error } = await supabase
        .from("mission_submissions")
        .upsert(payload, {
          onConflict: "user_id,mission_id",
        })
        .select("*")
        .single();

      if (error) {
        console.error("Error submitting mission:", error);
        return;
      }

      // Update mission progress to 50% when submitted
      const { error: progressError } = await supabase
        .from("mission_progress")
        .upsert(
          {
            user_id: user.id,
            mission_id: missionId,
            completed: false,
            completed_at: null,
          },
          {
            onConflict: "user_id,mission_id",
          }
        );

      if (progressError) {
        console.error("Error updating mission progress:", progressError);
        // Don't fail the submission if progress update fails
      }

      const s = data as any;
      const mapped: MissionSubmission = {
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
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      };
      setSubmission(mapped);
      setSubmissionWebsiteUrl(mapped.websiteUrl || "");
      setSubmissionPitchDeckUrl(mapped.pitchDeckUrl || "");

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

  const handleJoinMission = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsJoining(true);
    try {
      const supabase = createLearningClient();
      if (!supabase) {
        console.error("Supabase client not configured.");
        setIsJoining(false);
        return;
      }

      // Create mission progress entry
      const { data, error } = await supabase
        .from("mission_progress")
        .upsert(
          {
            user_id: user.id,
            mission_id: missionId,
            completed: false,
            checklist_progress: [],
            micro_checks_passed: 0,
            total_micro_checks: 0,
            last_accessed_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,mission_id",
          }
        )
        .select("*")
        .single();

      if (error) {
        console.error("Error joining mission:", error);
        setIsJoining(false);
        return;
      }

      if (data) {
        const p = data as any;
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
        // Switch to submission tab after joining
        setActiveTab("submission");
      }
    } catch (err) {
      console.error("Unexpected error joining mission:", err);
    } finally {
      setIsJoining(false);
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
    const isCompleted = completedCount === checklist.length;
    
    await supabase
      .from("mission_progress")
      .upsert({
        user_id: user.id,
        mission_id: missionId,
        checklist_progress: checklist,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      }, {
        onConflict: "user_id,mission_id",
      });

    // Send completion notification if mission is completed
    if (isCompleted && mission) {
      try {
        const authSupabase = createClient();
        if (authSupabase) {
          const { notifyMissionCompletion } = await import("@/lib/notifications-helpers");
          await notifyMissionCompletion(user.id, missionId, mission.title, authSupabase);
        }
      } catch (notifError) {
        console.error("Error sending mission completion notification:", notifError);
        // Don't fail checklist update if notification fails
      }
    }
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-base text-muted-foreground">Loading mission...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <p className="text-base text-destructive mb-4">Mission not found</p>
        <Link href="/missions">
          <Button variant="outline">
            Back to Missions
          </Button>
        </Link>
      </div>
    );
  }

  // Check if user can access this mission (prerequisites check)
  const isLocked = canAccess !== null && !canAccess.canAccess && !isAdmin;

  const checklist = missionContent?.checklist || [];
  const completedCount = checklist.filter((item) => item.completed).length;

  const getDateShort = (date: Date) => {
    const month = format(date, "MMM").toUpperCase();
    const day = format(date, "d");
    return `${month} ${day}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/missions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mission Board
          </Link>
        </Button>

        {/* Locked Message */}
        {isLocked && prerequisiteDetails.length > 0 && (
          <p className="mb-6 text-red-600 dark:text-red-400 font-medium">
            Mission Locked
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 lg:gap-12">
          {/* Left Panel - Mission Image & Core Information */}
          <div className="space-y-6">
            {/* Mission Image */}
            {mission.imageUrl ? (
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
                <Image
                  src={mission.imageUrl}
                  alt={mission.title}
                  fill
                  className="object-cover"
                  sizes="400px"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center">
                <Target className="h-16 w-16 text-white" />
              </div>
            )}

            {/* Core Information & Quick Information */}
            <div className="bg-card rounded-lg p-4 border border-border space-y-4">
              {/* Status */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="font-medium">
                  {progress?.completed ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300">Completed</span>
                    </span>
                  ) : submission?.status === "under_review" ? (
                    <span className="text-amber-600 dark:text-amber-400">Under Review</span>
                  ) : submission?.status === "approved" ? (
                    <span className="text-green-600 dark:text-green-400">Approved</span>
                  ) : submission?.status === "changes_requested" ? (
                    <span className="text-red-600 dark:text-red-400">Changes Requested</span>
                  ) : (
                    <span className="text-muted-foreground">In Progress</span>
                  )}
                </p>
              </div>

              {/* Difficulty */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Difficulty</p>
                <p className="font-medium capitalize">{mission.difficulty}</p>
              </div>

              {/* Stack Type */}
              {mission.stackType && mission.stackType !== "none" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Stack</p>
                  <p className="font-medium capitalize">{mission.stackType}</p>
                </div>
              )}

              {/* Category */}
              {mission.category && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-medium">{mission.category}</p>
                </div>
              )}

              {/* Submission Start */}
              {mission.submissionDeadline && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Submission Start</p>
                  <p className="font-medium">
                    {format(mission.submissionDeadline, "yyyy/MM/dd")}
                  </p>
                </div>
              )}

              {/* End Date */}
              {mission.endDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">End Date</p>
                  <p className="font-medium">
                    {format(mission.endDate, "MMM d, yyyy")}
                  </p>
                </div>
              )}

              {/* Estimated Time */}
              {mission.estimatedTime && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estimated Time</p>
                  <p className="font-medium">{mission.estimatedTime} minutes</p>
                </div>
              )}

              {/* Progress */}
              {checklist.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Progress</p>
                  <p className="font-medium">
                    {completedCount} / {checklist.length} completed
                  </p>
                </div>
              )}
            </div>

            {/* Requirements Section */}
            {prerequisiteDetails.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Requirements</h3>
                <div className="space-y-2">
                  {prerequisiteDetails.map((prereq) => {
                    // Check if this specific class is completed (not in missingClasses)
                    const isCompleted = canAccess ? !canAccess.missingClasses.includes(prereq.id) : false;
                    return (
                      <Link
                        key={prereq.id}
                        href={`/academy/classes/${prereq.id}`}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {prereq.thumbnail ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={prereq.thumbnail}
                              alt={prereq.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <span className="text-sm font-medium flex-1 line-clamp-2">{prereq.title}</span>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Join Mission Button - Always show, but disable after joining */}
            {user && (
              <div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleJoinMission}
                  disabled={isJoining || !!progress || isLocked}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : progress ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Joined
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Mission
                    </>
                  )}
                </Button>
                {!progress && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Join this mission to start working on it and submit your project
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Main Content */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {mission.title}
              </h1>
            </div>

            {/* Date & Time */}
            {(mission.submissionDeadline || mission.endDate) && (
                <div className="text-lg font-semibold">
                    {mission.submissionDeadline
                    ? format(mission.submissionDeadline, "yyyy/MM/dd")
                    : "No start date"}
                  {mission.endDate &&
                    ` - ${format(mission.endDate, "yyyy/MM/dd")}`}
              </div>
            )}

            {/* Difficulty Badge */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-md bg-muted text-sm font-medium capitalize">
                {mission.difficulty}
              </div>
              {mission.stackType && mission.stackType !== "none" && (
                <div className="px-3 py-1 rounded-md bg-muted text-sm font-medium capitalize">
                  {mission.stackType}
                </div>
              )}
            </div>

            {/* Overview with Tabs */}
            <div className="space-y-4">
              {isLocked ? (
                <div className="p-6 border border-border rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-center">
                    Complete the prerequisite classes to unlock this mission content.
                  </p>
                </div>
              ) : (
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "checklist" | "submission")} className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  {checklist.length > 0 && (
                    <TabsTrigger value="checklist">Checklist</TabsTrigger>
                  )}
                  {(progress || submission) && (
                    <TabsTrigger value="submission">Submission</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 pt-4">
                  <h2 className="text-2xl font-bold">About This Mission</h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="p-4 bg-muted/50 rounded-lg mb-4">
                      <p className="font-semibold text-lg mb-1">Mission Goal:</p>
                      <p className="text-foreground">{mission.goal}</p>
                    </div>
                    {mission.description && (
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed mb-6">
                        {mission.description}
                      </p>
                    )}
                    {missionContent?.markdownContent && (
                      <div className="mt-6">
                        <MarkdownContent content={missionContent.markdownContent} />
                      </div>
                    )}
                    {missionContent?.advancedTips && (
                      <div className="mt-6">
                        <Button
                          variant="outline"
                          onClick={() => setShowAdvancedTips(!showAdvancedTips)}
                          className="mb-4"
                        >
                          {showAdvancedTips ? "Hide" : "Show"} Advanced Tips
                        </Button>
                        {showAdvancedTips && (
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <MarkdownContent content={missionContent.advancedTips} />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-6 space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Mission Details</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Difficulty: <span className="capitalize">{mission.difficulty}</span></li>
                          {mission.stackType && mission.stackType !== "none" && (
                            <li>Stack: <span className="capitalize">{mission.stackType}</span></li>
                          )}
                          {mission.category && (
                            <li>Category: {mission.category}</li>
                          )}
                          {mission.submissionDeadline && (
                            <li>
                              Submission Start:{" "}
                              {format(mission.submissionDeadline, "yyyy/MM/dd")}
                            </li>
                          )}
                          {mission.endDate && (
                            <li>End Date: {format(mission.endDate, "MMMM d, yyyy")}</li>
                          )}
                          {mission.estimatedTime && (
                            <li>Estimated Time: {mission.estimatedTime} minutes</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {checklist.length > 0 && (
                  <TabsContent value="checklist" className="space-y-4 pt-4">
                    <h2 className="text-2xl font-bold">Mission Checklist</h2>
                    <Card>
                      <CardContent className="pt-6">
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
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {(progress || submission) && (
                  <TabsContent value="submission" className="space-y-4 pt-4">
                    <h2 className="text-2xl font-bold">Mission Submission</h2>
                  
                  {/* Submission Roadmap */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm mb-4">
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
                        <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                          Submission under review. You will get feedback once a mentor or admin has reviewed it.
                        </p>
                      )}
                      {submission?.status === "approved" && (
                        <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                          Submission approved! Great work.
                        </p>
                      )}
                      {submission?.status === "changes_requested" && (
                        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                          Changes requested. Please review the feedback and update your project.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Submission Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Submit Your Project</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmitMission} className="space-y-4">
                        {(mission?.submissionFields && mission.submissionFields.length > 0
                          ? mission.submissionFields
                          : [
                              { type: "git", label: "Git Repository URL", required: true, placeholder: "https://github.com/username/repo", helper: "" },
                              { type: "website", label: "Website URL", required: true, placeholder: "https://your-project.com", helper: "URL of your deployed website or web application" }
                            ]
                        ).map((field, index) => {
                          const fieldKey = field.type === "git" ? "git" : field.type === "website" ? "website" : field.type;
                          const fieldValue = submissionFieldValues[fieldKey] || 
                            (field.type === "git" ? submissionGitUrl : field.type === "website" ? submissionWebsiteUrl : "");
                          
                          return (
                            <div key={index} className="space-y-2">
                              <label className="text-sm font-medium" htmlFor={`field-${index}`}>
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                              </label>
                              <input
                                id={`field-${index}`}
                                type="url"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                placeholder={field.placeholder}
                                value={fieldValue}
                                onChange={(e) => {
                                  const newValues = { ...submissionFieldValues };
                                  newValues[fieldKey] = e.target.value;
                                  setSubmissionFieldValues(newValues);
                                  // Also update legacy state for backward compatibility
                                  if (field.type === "git") {
                                    setSubmissionGitUrl(e.target.value);
                                  } else if (field.type === "website") {
                                    setSubmissionWebsiteUrl(e.target.value);
                                  }
                                }}
                                required={field.required}
                              />
                              {field.helper && (
                                <p className="text-xs text-muted-foreground">
                                  {field.helper}
                                </p>
                              )}
                            </div>
                          );
                        })}
                        {mission?.category === "Developer" && (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium" htmlFor="pitch-deck-url">
                                Pitch Deck URL <span className="text-muted-foreground">(optional)</span>
                              </label>
                              <input
                                id="pitch-deck-url"
                                type="url"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                placeholder="https://docs.google.com/presentation/..."
                                value={submissionPitchDeckUrl}
                                onChange={(e) => setSubmissionPitchDeckUrl(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Link to your pitch deck (Google Slides, PDF, etc.)
                              </p>
                            </div>
                          </>
                        )}
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
                    </CardContent>
                  </Card>

                  {/* Admin / Mentor Review Panel */}
                  {isAdmin && submissionsForReview.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Submissions for Review</CardTitle>
                      </CardHeader>
                      <CardContent>
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
                                  {sub.websiteUrl && (
                                    <div className="mt-1">
                                      <p className="text-xs text-muted-foreground">Website:</p>
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
                                      <p className="text-xs text-muted-foreground">Pitch Deck:</p>
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
                                <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                                  <p className="font-semibold mb-1">Admin note</p>
                                  <p className="leading-snug">{sub.feedback}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  </TabsContent>
                )}
              </Tabs>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

