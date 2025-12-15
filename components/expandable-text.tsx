"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  maxChars?: number;
}

export function ExpandableText({ text, maxChars = 400 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const needsTruncate = text.length > maxChars;
  const displayText = !needsTruncate || expanded ? text : text.slice(0, maxChars) + "…";

  return (
    <div className="space-y-2">
      <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
        {displayText}
      </p>
      {needsTruncate && (
        <button
          type="button"
          className="text-xs font-semibold text-primary hover:underline"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}


