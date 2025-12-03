"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { createLearningClient } from "@/lib/supabase/learning-client";

interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  question: string;
  options?: string[];
  correctAnswer: string;
  scoreWeight: number;
}

interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
}

interface QuizComponentProps {
  quizId: string;
  lessonId: string;
}

export function QuizComponent({ quizId, lessonId }: QuizComponentProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const supabase = createLearningClient();
        const { data, error: fetchError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (fetchError) {
          console.error("Error loading quiz:", fetchError);
          setError("Failed to load quiz.");
          return;
        }

        if (data) {
          setQuiz(data as Quiz);
        }
      } catch (err) {
        console.error("Unexpected error loading quiz:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = () => {
    if (!quiz) return;

    // Check if all questions are answered
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setSubmitted(true);
    setShowResults(true);

    // Calculate score
    let totalScore = 0;
    let maxScore = 0;

    quiz.questions.forEach((question) => {
      const userAnswer = answers[question.id]?.trim().toLowerCase();
      const correctAnswer = question.correctAnswer.trim().toLowerCase();
      maxScore += question.scoreWeight || 1;

      if (userAnswer === correctAnswer) {
        totalScore += question.scoreWeight || 1;
      }
    });

    setScore(totalScore);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
    setScore(null);
  };

  if (loading) {
    return (
      <Card className="my-8">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading quiz...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="my-8">
        <CardContent className="py-8">
          <p className="text-sm text-destructive text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <Card className="my-8">
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            This quiz doesn't have any questions yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalScore = quiz.questions.reduce((sum, q) => sum + (q.scoreWeight || 1), 0);

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>{quiz.title || "Quiz"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {quiz.questions.map((question, index) => {
          const userAnswer = answers[question.id];
          const isCorrect = userAnswer?.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
          const showAnswer = showResults;

          return (
            <div key={question.id} className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="font-medium text-sm text-muted-foreground min-w-[2rem]">
                  {index + 1}.
                </span>
                <div className="flex-1">
                  <p className="font-medium mb-3">{question.question}</p>

                  {question.type === "multiple-choice" && question.options && (
                    <RadioGroup
                      value={userAnswer || ""}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                      disabled={submitted}
                    >
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2 py-1">
                          <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                          <Label
                            htmlFor={`${question.id}-${optIndex}`}
                            className={`cursor-pointer flex-1 ${
                              showAnswer && option === question.correctAnswer
                                ? "text-green-600 dark:text-green-400 font-medium"
                                : showAnswer && option === userAnswer && !isCorrect
                                ? "text-red-600 dark:text-red-400"
                                : ""
                            }`}
                          >
                            {option}
                            {showAnswer && option === question.correctAnswer && (
                              <CheckCircle2 className="inline-block h-4 w-4 ml-2" />
                            )}
                            {showAnswer && option === userAnswer && !isCorrect && (
                              <XCircle className="inline-block h-4 w-4 ml-2" />
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.type === "true-false" && (
                    <RadioGroup
                      value={userAnswer || ""}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                      disabled={submitted}
                    >
                      <div className="flex items-center space-x-2 py-1">
                        <RadioGroupItem value="true" id={`${question.id}-true`} />
                        <Label
                          htmlFor={`${question.id}-true`}
                          className={`cursor-pointer ${
                            showAnswer && "true" === question.correctAnswer.toLowerCase()
                              ? "text-green-600 dark:text-green-400 font-medium"
                              : showAnswer && "true" === userAnswer?.toLowerCase() && !isCorrect
                              ? "text-red-600 dark:text-red-400"
                              : ""
                          }`}
                        >
                          True
                          {showAnswer && "true" === question.correctAnswer.toLowerCase() && (
                            <CheckCircle2 className="inline-block h-4 w-4 ml-2" />
                          )}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 py-1">
                        <RadioGroupItem value="false" id={`${question.id}-false`} />
                        <Label
                          htmlFor={`${question.id}-false`}
                          className={`cursor-pointer ${
                            showAnswer && "false" === question.correctAnswer.toLowerCase()
                              ? "text-green-600 dark:text-green-400 font-medium"
                              : showAnswer && "false" === userAnswer?.toLowerCase() && !isCorrect
                              ? "text-red-600 dark:text-red-400"
                              : ""
                          }`}
                        >
                          False
                          {showAnswer && "false" === question.correctAnswer.toLowerCase() && (
                            <CheckCircle2 className="inline-block h-4 w-4 ml-2" />
                          )}
                        </Label>
                      </div>
                    </RadioGroup>
                  )}

                  {question.type === "short-answer" && (
                    <Input
                      value={userAnswer || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Enter your answer..."
                      disabled={submitted}
                      className={
                        showAnswer
                          ? isCorrect
                            ? "border-green-600 dark:border-green-400"
                            : "border-red-600 dark:border-red-400"
                          : ""
                      }
                    />
                  )}

                  {showAnswer && (
                    <div className="mt-2 text-sm">
                      {isCorrect ? (
                        <p className="text-green-600 dark:text-green-400 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Correct! ({question.scoreWeight || 1} point{question.scoreWeight !== 1 ? "s" : ""})
                        </p>
                      ) : (
                        <div>
                          <p className="text-red-600 dark:text-red-400 flex items-center gap-2 mb-1">
                            <XCircle className="h-4 w-4" />
                            Incorrect
                          </p>
                          <p className="text-muted-foreground">
                            Correct answer: <span className="font-medium">{question.correctAnswer}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {showResults && score !== null && (
          <div className="mt-6 p-4 rounded-lg bg-muted border border-border">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Quiz Results</p>
              <p className="text-2xl font-bold mb-1">
                {score} / {totalScore}
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.round((score / totalScore) * 100)}% correct
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          {!submitted ? (
            <Button onClick={handleSubmit} className="flex-1">
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Retake Quiz
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

