"use client";

import React, { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
// Note: Sandpack integration - uncomment when ready to use
// import { SandpackProvider, SandpackCodeEditor, SandpackPreview, SandpackConsole } from "@codesandbox/sandpack-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Play, Loader2, CheckCircle2, XCircle, Save, RotateCcw, Code2, Terminal, Sparkles, FileCode } from "lucide-react";

interface FileTree {
  [filename: string]: string;
}

interface EnhancedLiteIDEProps {
  initialFiles?: FileTree;
  lessonId?: string;
  missionId?: string;
  userId?: string;
  onFilesChange?: (files: FileTree) => void;
  onRunComplete?: (output: string, error?: string) => void;
  stackType?: "nextjs" | "python" | "solana" | "node" | "react" | "other";
}

export default function EnhancedLiteIDE({
  initialFiles = { "index.js": "// Welcome! Start coding here...\nconsole.log('Hello, World!');" },
  lessonId,
  missionId,
  userId,
  onFilesChange,
  onRunComplete,
  stackType = "react",
}: EnhancedLiteIDEProps) {
  const [files, setFiles] = useState<FileTree>(initialFiles);
  const [activeFile, setActiveFile] = useState<string>(Object.keys(initialFiles)[0] || "index.js");
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<Array<{ name: string; passed: boolean; message?: string }>>([]);
  const [activeTab, setActiveTab] = useState<"console" | "tests" | "ai">("console");
  const [viewMode, setViewMode] = useState<"editor" | "split" | "preview">("split");
  const [sandpackFiles, setSandpackFiles] = useState<Record<string, string>>({});

  // Convert files to Sandpack format
  useEffect(() => {
    const sandpackFormat: Record<string, string> = {};
    Object.entries(files).forEach(([name, content]) => {
      sandpackFormat[`/${name}`] = content;
    });
    setSandpackFiles(sandpackFormat);
  }, [files]);

  // Notify parent of file changes
  useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

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
      
      if (data.error) {
        setConsoleOutput(`Error: ${data.error}\n${data.output || ""}`);
        onRunComplete?.(data.output || "", data.error);
      } else {
        setConsoleOutput(data.output || JSON.stringify(data, null, 2));
        onRunComplete?.(data.output || "", undefined);
      }
    } catch (e) {
      const errorMsg = `Failed to run code: ${e instanceof Error ? e.message : String(e)}`;
      setConsoleOutput(errorMsg);
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
    setAiResponse("Thinking...");
    setActiveTab("ai");

    // Build a comprehensive prompt with context
    const prompt = `You are DeMentor, an AI coding mentor for Web3, Solana, and modern fullstack development.

Lesson Context:
- LessonId: ${lessonId || "N/A"}
- MissionId: ${missionId || "N/A"}

Current Code Files:
${Object.entries(files)
      .map(([name, content]) => `### ${name}\n\`\`\`\n${content}\n\`\`\``)
      .join("\n\n")}

User Question: ${aiPrompt}

Please provide helpful, step-by-step guidance. Speak clearly and concisely. Prefer step-by-step guidance over full code dumps. Ask clarifying questions when the user's goal is ambiguous. When showing code, keep snippets focused and minimal.`;

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, lessonId, missionId, userId }),
      });

      const data = await res.json();
      
      if (data.error) {
        setAiResponse(`Error: ${data.error}`);
      } else {
        setAiResponse(data.answer || data.response || "No response received");
        
        if (data.diff) {
          setAiResponse((prev) => `${prev}\n\n--- Code Changes ---\n${JSON.stringify(data.diff, null, 2)}`);
        }
      }
    } catch (e) {
      setAiResponse(`Failed to get AI response: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsAiLoading(false);
    }
  }, [aiPrompt, files, lessonId, missionId, userId]);

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
        setConsoleOutput(`✅ Snapshot saved: ${data.snapshot?.id || "success"}`);
      }
    } catch (e) {
      setConsoleOutput(`Failed to save snapshot: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [files, missionId, userId]);

  // Determine Sandpack template based on stack type
  const getSandpackTemplate = () => {
    switch (stackType) {
      case "nextjs":
        return "nextjs";
      case "react":
        return "react";
      case "node":
        return "node";
      default:
        return "vanilla";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] min-h-[600px] gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          {/* File Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-md">
            {Object.keys(files).map((filename) => (
              <button
                key={filename}
                className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 whitespace-nowrap ${
                  filename === activeFile
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setActiveFile(filename)}
              >
                <FileCode className="inline h-3 w-3 mr-1" />
                {filename}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-background rounded-md p-1 border border-border">
            <Button
              variant={viewMode === "editor" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("editor")}
              className="h-7 px-2"
            >
              <Code2 className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === "split" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
              className="h-7 px-2"
            >
              <Terminal className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("preview")}
              className="h-7 px-2"
            >
              <Play className="h-3 w-3" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={saveSnapshot} className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button variant="default" size="sm" onClick={runInSandbox} disabled={isRunning} className="gap-2">
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid gap-4 min-h-0" style={{
        gridTemplateColumns: viewMode === "editor" ? "1fr" : viewMode === "preview" ? "0 1fr" : "1fr 1fr"
      }}>
        {/* Editor Section */}
        {(viewMode === "editor" || viewMode === "split") && (
          <Card className="flex flex-col min-h-0 p-0 overflow-hidden">
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
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  smoothScrolling: true,
                }}
              />
            </div>
          </Card>
        )}

        {/* Preview Section */}
        {(viewMode === "split" || viewMode === "preview") && (
          <Card className="flex flex-col min-h-0 p-0 overflow-hidden bg-muted/30">
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <Play className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold mb-2">Live Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Run" to execute your code and see the output in the console below.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sandpack preview coming soon for React/Next.js projects
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Panel: Console, Tests, AI */}
      <Card className="h-64 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger value="console" className="gap-2">
              <Terminal className="h-4 w-4" />
              Console
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          {/* Console Tab */}
          <TabsContent value="console" className="flex-1 flex flex-col min-h-0 mt-0 p-4">
            <div className="flex-1 bg-black text-green-400 p-4 rounded-md font-mono text-sm overflow-auto">
              <pre className="whitespace-pre-wrap">{consoleOutput || "Console output will appear here..."}</pre>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runMicroChecks}
              disabled={isRunning}
              className="mt-2 gap-2 self-start"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Run Micro-checks
            </Button>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="flex-1 flex flex-col min-h-0 mt-0 p-4 overflow-auto">
            <div className="space-y-2">
              {testResults.length === 0 ? (
                <p className="text-muted-foreground text-sm">No test results yet. Click "Run Micro-checks" to run tests.</p>
              ) : (
                testResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-md border transition-all ${
                      result.passed ? "bg-green-500/10 border-green-500/50" : "bg-red-500/10 border-red-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-700 dark:text-red-500" />
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
          <TabsContent value="ai" className="flex-1 flex flex-col min-h-0 mt-0 p-4">
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
                    <Sparkles className="h-4 w-4" />
                  )}
                  Ask AI
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
              <div className="flex-1 overflow-auto bg-muted/50 p-3 rounded-md min-h-[100px]">
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
  );
}

