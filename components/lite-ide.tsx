 "use client";
 
 import React, { useState, useEffect, useCallback } from "react";
 import Editor from "@monaco-editor/react";
 import { Button } from "@/components/ui/button";
 import { Card } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Textarea } from "@/components/ui/textarea";
import { Play, Loader2, CheckCircle2, XCircle, Save, RotateCcw, Terminal, ListChecks, Sparkles } from "lucide-react";

interface FileTree {
  [filename: string]: string;
}

 interface LiteIDEProps {
   initialFiles?: FileTree;
   lessonId?: string;
   lessonTitle?: string;
   lessonContent?: string;
   missionId?: string;
   userId?: string;
   onFilesChange?: (files: FileTree) => void;
   onRunComplete?: (output: string, error?: string) => void;
 }

 export default function LiteIDE({
   initialFiles = { "index.js": "// Welcome! Start coding here...\nconsole.log('Hello, World!');" },
   lessonId,
   lessonTitle,
   lessonContent,
   missionId,
   userId,
   onFilesChange,
   onRunComplete,
 }: LiteIDEProps) {
  const [files, setFiles] = useState<FileTree>(initialFiles);
  const [activeFile, setActiveFile] = useState<string>(Object.keys(initialFiles)[0] || "index.js");
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<Array<{ name: string; passed: boolean; message?: string }>>([]);
  const [activeTab, setActiveTab] = useState<"console" | "tests" | "ai">("console");
  const [hasShownGuideIntro, setHasShownGuideIntro] = useState<boolean>(false);
  const [lastRunOutput, setLastRunOutput] = useState<string | null>(null);
  const [lastRunHadError, setLastRunHadError] = useState<boolean>(false);

  // Notify parent of file changes
  useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  // First-time Guide intro: auto-open Guide tab with a starter question and response
  useEffect(() => {
    if (hasShownGuideIntro) return;

    const starter = "What do you think this function does? Just guess.";

    // Auto-ask the AI with the starter question
    setActiveTab("ai");
    setAiPrompt(starter);
    setHasShownGuideIntro(true);
    
    // Trigger the AI call
    const askStarter = async () => {
      const prompt = `LessonId: ${lessonId || "N/A"}\nLessonTitle: ${lessonTitle || "N/A"}\nLessonContent: ${lessonContent || ""}\n\nFiles:\n${Object.entries(files)
        .map(([name, content]) => `### ${name}\n\`\`\`\n${content}\n\`\`\``)
        .join("\n\n")}\n\nQuestion: ${starter}`;

      try {
        const res = await fetch("/api/ai/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, lessonId, missionId }),
        });

        const data = await res.json();
        setAiResponse(data.answer || data.response || "No response received");
      } catch (e) {
        setAiResponse(`Failed to get AI response: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    
    void askStarter();
  }, [hasShownGuideIntro, lessonId, lessonTitle, lessonContent, files, missionId]);

  const handleEdit = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setFiles((prev) => ({ ...prev, [activeFile]: value }));
    }
  }, [activeFile]);

  const runInSandbox = useCallback(async () => {
    setIsRunning(true);
    setConsoleOutput("Running...\n");
    setActiveTab("console");

    try {
      const res = await fetch("/api/sandbox/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, lessonId, missionId, userId }),
      });

      const data = await res.json();

      const outputText = data.output || JSON.stringify(data, null, 2);
      const hadError = Boolean(data.error);

      if (hadError) {
        setConsoleOutput(`Error: ${data.error}\n${outputText || ""}`);
        onRunComplete?.(outputText || "", data.error);
      } else {
        setConsoleOutput(outputText);
        onRunComplete?.(outputText || "", undefined);
      }

      setLastRunOutput(outputText);
      setLastRunHadError(hadError);
    } catch (e) {
      const errorMsg = `Failed to run code: ${e instanceof Error ? e.message : String(e)}`;
      setConsoleOutput(errorMsg);
      setLastRunOutput(errorMsg);
      setLastRunHadError(true);
      onRunComplete?.("", errorMsg);
    } finally {
      setIsRunning(false);
    }
  }, [files, lessonId, missionId, userId, onRunComplete]);

  const runMicroChecks = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);
    setActiveTab("tests");

    try {
      const res = await fetch("/api/sandbox/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, lessonId, missionId }),
      });

      const data = await res.json();
      
      if (data.results && Array.isArray(data.results)) {
        setTestResults(data.results);
      } else {
        setTestResults([{ name: "Test", passed: false, message: data.error || "Unknown error" }]);
      }
    } catch (e) {
      setTestResults([{ name: "Test", passed: false, message: `Failed to run tests: ${e instanceof Error ? e.message : String(e)}` }]);
    } finally {
      setIsRunning(false);
    }
  }, [files, lessonId, missionId]);

 const askAI = useCallback(async () => {
   if (!aiPrompt.trim()) return;
 
   setIsAiLoading(true);
   setActiveTab("ai");
   setAiResponse("Thinking...");

   // Build a comprehensive prompt with context
   const prompt = `You are DeMentor, an AI coding mentor for Web3, Solana, and modern fullstack development.

Lesson Context:
- LessonId: ${lessonId || "N/A"}
- LessonTitle: ${lessonTitle || "N/A"}
- LessonContent: ${lessonContent || ""}

Current Code Files:
${Object.entries(files)
  .map(([name, content]) => `### ${name}\n\`\`\`\n${content}\n\`\`\``)
  .join("\n\n")}

${lastRunOutput ? `Last Run Output:\n\`\`\`\n${lastRunOutput}\n\`\`\`\n` : ""}
${lastRunHadError ? "Note: The last run had an error.\n" : ""}

User Question: ${aiPrompt}

Please provide helpful, step-by-step guidance. Speak clearly and concisely. Prefer step-by-step guidance over full code dumps. Ask clarifying questions when the user's goal is ambiguous.`;

   try {
     const res = await fetch("/api/ai/ask", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ prompt, lessonId, missionId }),
     });

     const data = await res.json();
     
     if (data.error) {
       setAiResponse(`Error: ${data.error}`);
     } else {
       setAiResponse(data.answer || data.response || "No response received");
     }
   } catch (e) {
     setAiResponse(`Failed to get AI response: ${e instanceof Error ? e.message : String(e)}`);
   } finally {
     setIsAiLoading(false);
   }
 }, [aiPrompt, files, lessonContent, lessonId, lessonTitle, missionId, lastRunOutput, lastRunHadError]);

  const saveSnapshot = useCallback(async () => {
    try {
      const res = await fetch("/api/sandbox/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, missionId, userId, name: `Snapshot ${new Date().toLocaleString()}` }),
      });

      const data = await res.json();
      if (data.error) {
        setConsoleOutput(`Failed to save snapshot: ${data.error}`);
      } else {
        setConsoleOutput(`Snapshot saved: ${data.snapshot?.id || "success"}`);
      }
    } catch (e) {
      setConsoleOutput(`Failed to save snapshot: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [files, missionId, userId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)] gap-4 h-full min-h-[420px]">
      {/* Editor Section */}
      <div className="flex flex-col rounded-xl bg-zinc-950/70 dark:bg-zinc-900/70 border border-zinc-800/60 overflow-hidden backdrop-blur-sm">
        {/* File Tabs */}
        <div className="flex items-center gap-2 p-2 bg-muted/50 border-b overflow-x-auto">
          {Object.keys(files).map((filename) => (
            <button
              key={filename}
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                filename === activeFile
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => setActiveFile(filename)}
            >
              {filename}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={saveSnapshot}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={runInSandbox}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run
            </Button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={activeFile.endsWith(".js") || activeFile.endsWith(".jsx") ? "javascript" : 
                     activeFile.endsWith(".ts") || activeFile.endsWith(".tsx") ? "typescript" :
                     activeFile.endsWith(".py") ? "python" :
                     activeFile.endsWith(".json") ? "json" : "javascript"}
            value={files[activeFile] || ""}
            onChange={handleEdit}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>
      </div>

      {/* Right Panel: Console, Tests, AI */}
      <div className="flex flex-col">
        <Card className="flex-1 flex flex-col min-h-0 p-3 sm:p-4 border-0 bg-zinc-950/70 dark:bg-zinc-900/70 shadow-none backdrop-blur-sm rounded-xl">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Output &amp; Assistant
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 gap-1 text-[11px] sm:text-xs">
              <TabsTrigger className="flex items-center justify-center" value="console">
                <Terminal className="h-4 w-4" />
                <span className="sr-only">Console</span>
              </TabsTrigger>
              <TabsTrigger className="flex items-center justify-center" value="tests">
                <ListChecks className="h-4 w-4" />
                <span className="sr-only">Tests</span>
              </TabsTrigger>
              <TabsTrigger className="flex items-center justify-center" value="ai">
                <Sparkles className="h-4 w-4" />
                <span className="sr-only">Guide</span>
              </TabsTrigger>
            </TabsList>

            {/* Console Tab */}
            <TabsContent value="console" className="flex-1 flex flex-col min-h-0 mt-3 sm:mt-4">
              <div className="flex-1 bg-black text-green-400 p-3 sm:p-4 rounded-md font-mono text-xs sm:text-sm overflow-auto">
                <pre className="whitespace-pre-wrap">{consoleOutput || "Console output will appear here..."}</pre>
              </div>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runMicroChecks}
                  disabled={isRunning}
                  className="gap-2"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Run Micro-checks
                </Button>
              </div>
            </TabsContent>

            {/* Tests Tab */}
            <TabsContent value="tests" className="flex-1 flex flex-col min-h-0 mt-3 sm:mt-4">
              <div className="flex-1 overflow-auto space-y-2">
                {testResults.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No test results yet. Click "Run Micro-checks" to run tests.</p>
                ) : (
                  testResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-md border ${
                        result.passed ? "bg-green-500/10 border-green-500/50" : "bg-red-500/10 border-red-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium text-sm">{result.name}</span>
                      </div>
                      {result.message && (
                        <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* AI Assistant Tab */}
            <TabsContent value="ai" className="flex-1 flex flex-col min-h-0 mt-3 sm:mt-4">
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <Textarea
                  className="flex-1 min-h-[100px]"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask me to explain this code, refactor it, generate tests, or help debug..."
                />
                <div className="flex gap-2">
                  <Button
                    onClick={askAI}
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="flex-1 gap-2"
                  >
                    {isAiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Ask AI"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAiPrompt("Explain this code line-by-line.");
                      askAI();
                    }}
                  >
                    Explain
                  </Button>
                </div>
                <div className="flex-1 overflow-auto bg-muted/50 p-3 rounded-md min-h-[150px]">
                  {aiResponse ? (
                    <pre className="whitespace-pre-wrap text-sm">{aiResponse}</pre>
                  ) : (
                    <p className="text-muted-foreground text-sm">AI responses will appear here...</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

