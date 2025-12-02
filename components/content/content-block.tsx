"use client";

import { ContentBlock as ContentBlockType } from "@/types/content";
import { VideoPlayer } from "@/components/video-player";
import { MarkdownContent } from "@/components/markdown-content";
import Image from "next/image";
import { FileText, Code2, ImageIcon, Video, Link2 } from "lucide-react";

interface ContentBlockProps {
  block: ContentBlockType;
}

export function ContentBlock({ block }: ContentBlockProps) {
  switch (block.type) {
    case 'video':
      if (!block.videoUrl) return null;
      return (
        <div className="w-full">
          <VideoPlayer url={block.videoUrl} />
          {block.description && (
            <p className="mt-4 text-sm text-muted-foreground">{block.description}</p>
          )}
        </div>
      );

    case 'image':
      if (!block.imageUrl) return null;
      return (
        <div className="w-full">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
            <Image
              src={block.imageUrl}
              alt={block.title}
              fill
              className="object-cover"
            />
          </div>
          {block.description && (
            <p className="mt-4 text-sm text-muted-foreground">{block.description}</p>
          )}
        </div>
      );

    case 'document':
      if (!block.documentUrl) return null;
      return (
        <div className="border border-border rounded-lg p-6 bg-muted/50">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-medium">{block.title}</h3>
          </div>
          {block.description && (
            <p className="text-sm text-muted-foreground mb-4">{block.description}</p>
          )}
          <a
            href={block.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <Link2 className="h-4 w-4" />
            Open Document
          </a>
        </div>
      );

    case 'markdown':
      if (!block.markdownContent) return null;
      return (
        <div className="w-full">
          <MarkdownContent content={block.markdownContent} />
        </div>
      );

    case 'code':
      if (!block.codeContent) return null;
      return (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Code</span>
          </div>
          <pre className="p-4 overflow-x-auto bg-background">
            <code className="text-sm font-mono">{block.codeContent}</code>
          </pre>
        </div>
      );

    case 'embed':
      if (!block.embedUrl) return null;
      return (
        <div className="w-full aspect-video rounded-lg overflow-hidden border border-border">
          <iframe
            src={block.embedUrl}
            className="w-full h-full"
            allowFullScreen
            title={block.title}
          />
        </div>
      );

    default:
      return (
        <div className="border border-border rounded-lg p-6 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Unsupported content type: {block.type}
          </p>
        </div>
      );
  }
}



