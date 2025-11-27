export interface LessonGuideContext {
  lessonId?: string;
  lessonTitle?: string;
  lessonContent?: string;
  files: Record<string, string>;
  message: string;
  lastOutput?: string | null;
  hadError?: boolean;
}

export function getLessonGuideReply(ctx: LessonGuideContext): string {
  const {
    lessonTitle = "this lesson",
    lessonContent = "",
    files,
    message,
    lastOutput,
    hadError,
  } = ctx;
  const lower = message.toLowerCase();

  const recentCode = Object.values(files || {})[0]?.slice(0, 280) || "";
  const recentOutput = (lastOutput || "").slice(0, 260);

  const hasErrorWords =
    lower.includes("error") ||
    lower.includes("bug") ||
    lower.includes("not working") ||
    lower.includes("fail");

  const outputLooksError =
    hadError ||
    (!!recentOutput &&
      (recentOutput.toLowerCase().includes("error") ||
        recentOutput.toLowerCase().includes("exception") ||
        recentOutput.toLowerCase().includes("failed")));

  const wantsExplain =
    lower.includes("explain") ||
    lower.includes("walk through") ||
    lower.includes("help me understand");

  const wantsRefactor =
    lower.includes("refactor") ||
    lower.includes("clean") ||
    lower.includes("improve") ||
    lower.includes("optimize");

  const wantsTests =
    lower.includes("test") ||
    lower.includes("micro-check") ||
    lower.includes("assert");

  if (wantsExplain) {
    return [
      `Let's walk through **${lessonTitle}** together.`,
      "",
      "1. **Restate the goal clearly**",
      "   - In one sentence, tell me what you're trying to understand.",
      "   - Example: `Explain how the data flows in this component from props to state to JSX.`",
      "",
      "2. **Point to a specific area**",
      "   - Mention a line number, function name, or section.",
      "   - Example: `Focus on the part where we call useEffect in the lesson example.`",
      "",
      "3. **Ask for the style of explanation**",
      "   - Examples: `Explain like I'm new to React`, `Compare this to plain JavaScript`, `Give me a step‑by‑step mental model`.",
      "",
      "Try sending me a prompt like:",
      "",
      `> Explain, step‑by‑step, what happens in ${lessonTitle} when this code runs, focusing on how React renders and updates the UI.`,
    ].join("\n");
  }

  if (hasErrorWords || outputLooksError) {
    return [
      "Nice, this is a debugging moment. When you talk to a real AI, structure your debugging prompt like this:",
      "",
      "1. **Context**",
      "   - What are you building? (feature / lesson / file name)",
      "   - What stack are you on? (Next.js, React, etc.)",
      "",
      "2. **The symptoms**",
      "   - Exact error message and where it appears (console / browser / terminal).",
      "   - What you expected vs what actually happened.",
      "",
      "3. **Relevant code only**",
      "   - Paste just the function / component that’s failing.",
      "   - Mention which line you think is suspicious.",
      "",
      "4. **A clear ask**",
      "   - Example: `Help me find the minimal fix`, or `Explain why this state update doesn't re‑render.`",
      "",
      "Draft a prompt like:",
      "",
      "```text",
      "I'm following the lesson and building [feature].",
      "Stack: Next.js + React.",
      "",
      "Error: [paste exact error]. It happens when I [what you do].",
      "",
      "Here's the component that's failing:",
      "[paste only the relevant code].",
      "",
      "Please: (1) explain why this is happening, and (2) show a minimal fix.",
      "```",
      "",
      recentOutput
        ? "Here is the **last output** you saw. Copy only the important part into your prompt:"
        : "",
      recentOutput ? "```text\n" + recentOutput + "\n```" : "",
      "",
      "If you want, paste your current error and I’ll help you turn it into a clean AI‑ready debugging prompt.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (wantsRefactor) {
    return [
      "To ask an AI to refactor code effectively, use this pattern:",
      "",
      "1. **Goal** – what “better” means for you:",
      "   - cleaner, more readable, fewer props, smaller component, etc.",
      "",
      "2. **Constraints** – what must NOT change:",
      "   - same behavior, same public API, keep using hooks from the lesson, etc.",
      "",
      "3. **Context** – where this code lives:",
      "   - `This is part of the lesson component for`, or `This runs inside Lite IDE as an example`.",
      "",
      "4. **Code** – only the relevant part:",
      "   - paste just the function / component you want refactored.",
      "",
      "Example refactor prompt:",
      "",
      "```text",
      "I have a React component from a lesson about " +
        lessonTitle +
        ".",
      "Goal: make it easier to read and follow the data flow.",
      "Constraints: keep the same behavior and props; no new libraries.",
      "",
      "Here is the component:",
      "[paste code here]",
      "",
      "Refactor it and then explain what changed and why.",
      "```",
      "",
      "You can practice by pasting a small piece of your code here and writing a refactor prompt in this structure.",
    ].join("\n");
  }

  if (wantsTests) {
    return [
      "Good instinct—testing is where AI can really help you.",
      "",
      "When asking an AI to help with tests, structure your prompt like this:",
      "",
      "1. **Describe the behavior**",
      "   - What should this function/component do in plain language?",
      "",
      "2. **Show the code under test**",
      "   - Paste just the function or component you want tests for.",
      "",
      "3. **Specify the test style / stack**",
      "   - e.g. Jest + React Testing Library, or simple node assertions.",
      "",
      "4. **Ask for coverage**",
      "   - Happy path, edge cases, and at least one failure case.",
      "",
      "Example testing prompt:",
      "",
      "```text",
      "I'm practicing from the lesson " +
        lessonTitle +
        ".",
      "Here is a function/component I want to test:",
      "[paste code]",
      "",
      "Using Jest (and React Testing Library if needed), write tests that:",
      "- cover the normal case,",
      "- handle one edge case, and",
      "- include a failure case.",
      "",
      "Explain briefly what each test is asserting.",
      "```",
      "",
      "Try rewriting your question into that structure and see how clear it feels.",
    ].join("\n");
  }

  // Default coaching response
  const hasLessonContent = lessonContent.trim().length > 0;

  return [
    "You’re talking to a **practice AI guide** that runs entirely in your browser.",
    "",
    "Use me to practice *good prompting habits* before you ever touch a real model:",
    "",
    "1. **Start with one clear sentence**",
    "   - Example: `Help me implement the main idea from " +
      lessonTitle +
      " in my own words.`",
    "",
    "2. **Give context**",
    "   - What are you building? Which part of the lesson are you on?",
    "   - Mention the file or component name if it matters.",
    "",
    "3. **Add constraints**",
    "   - Time limits, libraries you must/must not use, or style preferences.",
    "",
    "4. **End with a concrete output format**",
    "   - e.g. `Give me: (1) a plan, (2) code, (3) a short explanation.`",
    "",
    hasLessonContent
      ? "If you're stuck, try: `Summarize the key steps from this lesson in 5 bullet points, then give me a small coding task to apply them.`"
      : "If you're stuck, try: `Give me a tiny coding task that matches the concepts I'm learning, and show me what a good solution looks like.`",
    "",
    recentCode
      ? "I can also react to your current code. For example: `Here is my current code, tell me what it's doing and suggest one improvement, without changing behavior.`"
      : "",
    recentOutput
      ? "And I can use your last run’s output. For example: `Based on this output, what did my code actually do and what should I change next?`"
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}


