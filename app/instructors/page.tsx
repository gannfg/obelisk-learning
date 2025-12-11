"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mockInstructors, getCoursesByInstructor } from "@/lib/mock-data";
import { MessageSquare, Bot } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are DeMentor, an AI-native coding mentor for Web3, Solana, and modern fullstack development.
- Speak clearly and concisely.
- Prefer step-by-step guidance over full code dumps.
- Ask clarifying questions when the user's goal is ambiguous.
- When showing code, keep snippets focused and minimal.
- When teaching, connect concepts back to real-world dev workflows and tools like Cursor, Git, and Supabase.`;

export default function InstructorsPage() {
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get all instructors including DeMentor
  const allMentors = mockInstructors;

  const selectedMentorData = selectedMentor
    ? allMentors.find((m) => m.id === selectedMentor)
    : null;

  const isAIMentor = selectedMentorData?.id === "ai-instructor-1";

  const handleSelectMentor = (mentorId: string) => {
    setSelectedMentor(mentorId);
    // Initialize chat with welcome message for AI mentor
    if (mentorId === "ai-instructor-1") {
      setMessages([
        {
          role: "assistant",
          content:
            "Hey, I'm DeMentor — your AI mentor. What are you trying to learn or build today?",
        },
      ]);
    } else {
      // For human mentors, start with empty messages
      setMessages([]);
    }
    setInput("");
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !selectedMentor) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    if (isAIMentor) {
      // AI Mentor chat
      const historyText = nextMessages
        .map((m) => `${m.role === "user" ? "User" : "Mentor"}: ${m.content}`)
        .join("\n\n");

      const prompt = `${SYSTEM_PROMPT}\n\nConversation so far:\n\n${historyText}\n\nMentor:`;

      try {
        const res = await fetch("/api/ai/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        const data = await res.json();

        const answer: string =
          data.answer || data.response || "I wasn't able to respond.";

        setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I hit an error talking to the local Ollama model. Make sure Ollama is running and OLLAMA_URL / OLLAMA_MODEL are set.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Human mentor chat (placeholder - can be extended with real chat functionality)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Thank you for your message! ${selectedMentorData?.name} will get back to you soon.`,
          },
        ]);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-8">
        <h1 className="mb-3 text-3xl sm:text-4xl font-bold">Mentors</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Connect with expert mentors and chat with your AI mentor, DeMentor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        {/* Left Panel - Mentor List */}
        <div className="space-y-4">
          {allMentors.map((instructor) => {
            const courses = getCoursesByInstructor(instructor.id);
            const isSelected = selectedMentor === instructor.id;
            const isAI = instructor.id === "ai-instructor-1";

            return (
              <Card
                key={instructor.id}
                className={`transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleSelectMentor(instructor.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Image
                        src={instructor.avatar}
                        alt={instructor.name}
                        width={48}
                        height={48}
                        className="rounded-full w-12 h-12 object-cover object-top"
                        unoptimized
                      />
                      {isAI && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                          <Bot className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold leading-tight">
                          {instructor.name}
                        </h3>
                        {isAI && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAI
                          ? "Available 24/7"
                          : `${courses.length} class${courses.length !== 1 ? "es" : ""}`}
                      </p>
                    </div>
                    {isSelected && (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  {instructor.specializations && instructor.specializations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {instructor.specializations.slice(0, 3).map((spec) => (
                        <span
                          key={spec}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="flex flex-col h-[600px] lg:h-[calc(100vh-200px)] rounded-lg border border-border bg-muted/10 backdrop-blur-sm">
          {selectedMentorData ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-border bg-background/80 p-4 flex items-center gap-3">
                <Image
                  src={selectedMentorData.avatar}
                  alt={selectedMentorData.name}
                  width={40}
                  height={40}
                  className="rounded-full w-10 h-10 object-cover object-top"
                  unoptimized
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{selectedMentorData.name}</h3>
                    {isAIMentor && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        AI Mentor
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isAIMentor
                      ? "Available 24/7"
                      : selectedMentorData.bio}
                  </p>
                </div>
                {!isAIMentor && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/instructors/${selectedMentorData.id}`}>
                      View Profile
                    </Link>
                  </Button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      {isAIMentor
                        ? "Start a conversation with DeMentor"
                        : `Send a message to ${selectedMentorData.name}`}
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border border-border"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">
                      {isAIMentor ? "DeMentor is thinking..." : "Typing..."}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-border bg-background/80 p-4 space-y-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isAIMentor
                      ? "Ask DeMentor anything you're stuck on or curious about..."
                      : `Send a message to ${selectedMentorData.name}...`
                  }
                  className="min-h-[72px] max-h-[160px] resize-y text-sm"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    {isAIMentor
                      ? "Press Enter to send, Shift+Enter for a new line. Uses your local Ollama model."
                      : "Press Enter to send, Shift+Enter for a new line."}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading
                      ? isAIMentor
                        ? "Mentor thinking..."
                        : "Sending..."
                      : "Send"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="space-y-3">
                <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold">Select a Mentor</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Choose a mentor from the list to start a conversation. Try
                  DeMentor, your AI mentor available 24/7!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
