"use client";

import { useState } from "react";
import { Code2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiteIDE from "@/components/lite-ide";

interface LessonLiteIDEShellProps {
  lessonId: string;
  lessonTitle: string;
  lessonContent?: string;
  initialFiles: Record<string, string>;
}

export function LessonLiteIDEShell({
  lessonId,
  lessonTitle,
  lessonContent,
  initialFiles,
}: LessonLiteIDEShellProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="order-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Code2 className="h-4 w-4" />
          Open Lite IDE
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-3 sm:px-4 md:px-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={() => setOpen(false)}
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
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close Lite IDE</span>
          </Button>
        </div>
        <div className="flex-1 min-h-0">
          <LiteIDE
            initialFiles={initialFiles}
            lessonId={lessonId}
            lessonTitle={lessonTitle}
            lessonContent={lessonContent || ""}
          />
        </div>
      </div>
    </div>
  );
}


