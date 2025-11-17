"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuizPlaceholderProps {
  quizId?: string;
}

export function QuizPlaceholder({ quizId }: QuizPlaceholderProps) {
  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>Quiz</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Quiz functionality will be implemented in a future update. This
          placeholder is ready for Supabase integration.
        </p>
        {quizId && (
          <p className="mb-4 text-xs text-zinc-500">
            Quiz ID: {quizId}
          </p>
        )}
        <Button disabled>Take Quiz (Coming Soon)</Button>
      </CardContent>
    </Card>
  );
}

