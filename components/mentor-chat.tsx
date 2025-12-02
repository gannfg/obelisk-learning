"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

export function MentorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey, I'm DeMentor — your AI mentor. What are you trying to learn or build today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    // Build a single prompt from system prompt + chat history
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
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8 space-y-3 text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold">
          Chat with your AI Mentor
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          DeMentor runs on your local Ollama model. Ask about Web3, Solana,
          Next.js, Supabase, or how to work effectively with AI tools like
          Cursor.
        </p>
      </div>
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] items-start">
        {/* Left column – context / guidance */}
        <section className="space-y-4">
          <div className="hidden lg:block rounded-lg border border-dashed border-border/60 bg-muted/10 p-4 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Tips for better answers
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Describe what you&apos;re trying to build, not just the error.</li>
              <li>Mention your stack (Next.js, Supabase, Solana, etc.).</li>
              <li>Paste relevant snippets instead of whole files.</li>
              <li>Ask for a step-by-step plan before full code.</li>
            </ul>
          </div>
        </section>

        {/* Right column – chat panel */}
        <section className="flex flex-col h-[480px] md:h-[560px] lg:h-[calc(100vh-220px)] max-h-[720px] rounded-lg border border-border bg-muted/10 backdrop-blur-sm">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {messages.map((m, idx) => (
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
            ))}
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ask your first question to start the conversation.
              </p>
            )}
          </div>

          <div className="border-t border-border bg-background/80 p-3 sm:p-4 space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask DeMentor anything you're stuck on or curious about..."
              className="min-h-[72px] max-h-[160px] resize-y text-sm"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                Press Enter to send, Shift+Enter for a new line. Uses your
                local Ollama model (OLLAMA_URL, OLLAMA_MODEL).
              </p>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? "Mentor thinking..." : "Send"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


