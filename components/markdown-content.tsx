import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <pre className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-900" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

