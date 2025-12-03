"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, CheckCircle2 } from "lucide-react";

interface CourseCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  badgeName: string;
  backToCourseUrl: string;
}

export function CourseCompletionModal({
  open,
  onOpenChange,
  courseName,
  badgeName,
  backToCourseUrl,
}: CourseCompletionModalProps) {
  const router = useRouter();

  const handleClose = () => {
    onOpenChange(false);
    router.push(backToCourseUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            🎉 Congratulations! 🎉
          </DialogTitle>
          <DialogDescription className="text-base">
            You've completed <span className="font-semibold text-foreground">{courseName}</span>!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted p-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
              <span className="font-semibold">Reward Unlocked!</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-lg font-medium">{badgeName}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This badge has been added to your profile!
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              You've mastered all the lessons in this course. Keep up the great work!
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} className="w-full">
            View Course
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

