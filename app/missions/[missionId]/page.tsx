"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Target, Clock, Trophy, ChevronLeft } from "lucide-react";
import LiteIDE from "@/components/lite-ide";
import EnhancedLiteIDE from "@/components/enhanced-lite-ide";
import { MarkdownContent } from "@/components/markdown-content";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import type { Mission, MissionContent, MissionProgress } from "@/types";

export default function MissionPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.missionId as string;
  const { user, loading: authLoading } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [missionContent, setMissionContent] = useState<MissionContent | null>(null);
  const [progress, setProgress] = useState<MissionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [showAdvancedTips, setShowAdvancedTips] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    async function loadMission() {
      const supabase = createClient();

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

      setMission(missionData as Mission);
      setFiles(missionData.initial_files || {});

      // Fetch mission content
      const { data: contentData } = await supabase
        .from("mission_content")
        .select("*")
        .eq("mission_id", missionId)
        .single();

      if (contentData) {
        setMissionContent(contentData as MissionContent);
      }

      // Fetch or create sandbox
      if (user) {
        const { data: sandbox } = await supabase
          .from("sandboxes")
          .select("*")
          .eq("user_id", user.id)
          .eq("mission_id", missionId)
          .single();

        if (sandbox && sandbox.files) {
          setFiles(sandbox.files);
        }

        // Fetch progress
        const { data: progressData } = await supabase
          .from("mission_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("mission_id", missionId)
          .single();

        if (progressData) {
          setProgress(progressData as MissionProgress);
        }
      }

      setLoading(false);
    }

    loadMission();
  }, [missionId, user, authLoading]);

  const handleFilesChange = async (newFiles: Record<string, string>) => {
    setFiles(newFiles);
    
    if (user) {
      const supabase = createClient();
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

    const supabase = createClient();
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
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-sm sm:text-base text-muted-foreground">Loading mission...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-20 md:pb-8">
        <p className="text-sm sm:text-base text-destructive mb-3 sm:mb-4">Mission not found</p>
        <Link href="/missions">
          <Button variant="outline" className="text-xs sm:text-sm h-8 sm:h-9 md:h-10">
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
      <div className="mb-6">
        <Link href="/missions" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back to Mission Board
        </Link>
      </div>

      {/* Mission Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{mission.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {mission.estimatedTime || "?"} min
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
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lesson Content & Checklist */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-5 md:space-y-6">
          {missionContent?.markdownContent && (
            <Card className="p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Lesson Content</h2>
              <MarkdownContent content={missionContent.markdownContent} />
            </Card>
          )}

          {checklist.length > 0 && (
            <Card className="p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Checklist</h2>
              <div className="space-y-1.5 sm:space-y-2">
                {checklist.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => user && handleChecklistToggle(index)}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-xs sm:text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
                {completedCount} / {checklist.length} completed
              </div>
            </Card>
          )}

          {missionContent?.advancedTips && (
            <Card className="p-4 sm:p-5 md:p-6">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedTips(!showAdvancedTips)}
                className="w-full text-xs sm:text-sm h-8 sm:h-9 md:h-10"
              >
                {showAdvancedTips ? "Hide" : "Show"} Advanced Tips
              </Button>
              {showAdvancedTips && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <MarkdownContent content={missionContent.advancedTips} />
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right: Playground */}
        <div className="lg:col-span-2">
          <EnhancedLiteIDE
            initialFiles={files}
            lessonId={mission.lessonId}
            missionId={missionId}
            userId={user?.id}
            stackType={mission.stackType}
            onFilesChange={handleFilesChange}
            onRunComplete={(output, error) => {
              if (!error && output) {
                console.log("Run completed:", output);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

