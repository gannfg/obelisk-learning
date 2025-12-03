"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(
  () => import("react-player"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-white">
        <div className="text-center">
          <p className="text-sm">Loading video player...</p>
        </div>
      </div>
    )
  }
) as any;

interface VideoPlayerProps {
  url: string;
  className?: string;
}

export function VideoPlayer({ url, className }: VideoPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Reset error when URL changes
    setHasError(false);
    setPlayerReady(false);
  }, [url]);

  if (!isMounted) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-lg bg-black ${className}`}>
        <div className="flex h-full items-center justify-center text-white">
          Loading video player...
        </div>
      </div>
    );
  }

  if (!url || url.trim() === "") {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-lg bg-muted border border-border ${className}`}>
        <div className="flex h-full items-center justify-center text-muted-foreground p-6">
          <div className="text-center">
            <p className="text-sm font-medium mb-2">No video URL provided</p>
            <p className="text-xs">Please add a video URL to this lesson.</p>
          </div>
        </div>
      </div>
    );
  }

  // Validate URL format
  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      // Also check for YouTube/Vimeo short formats
      return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/.test(urlString);
    }
  };

  if (!isValidUrl(url)) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-lg bg-muted border border-border ${className}`}>
        <div className="flex h-full items-center justify-center text-muted-foreground p-6">
          <div className="text-center">
            <p className="text-sm font-medium mb-2">Invalid video URL</p>
            <p className="text-xs text-gray-400 mb-4">URL: {url}</p>
            <p className="text-xs">Please provide a valid YouTube, Vimeo, or video URL.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-black ${className}`} style={{ aspectRatio: '16/9' }}>
      {hasError ? (
        <div className="flex h-full items-center justify-center text-white p-6" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <p className="text-sm font-medium mb-2">Unable to load video</p>
            <p className="text-xs text-gray-400 mb-4">URL: {url}</p>
            <p className="text-xs">Please check if the video URL is valid and accessible.</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
          <div className="absolute top-0 left-0 w-full h-full">
            <ReactPlayer
              url={url}
              width="100%"
              height="100%"
              controls
              playing={false}
              light={false}
              onReady={() => {
                console.log("Video player ready");
                setPlayerReady(true);
              }}
              onError={(error: any) => {
                console.error("Video player error:", error);
                console.error("Video URL:", url);
                setHasError(true);
              }}
              onStart={() => {
                console.log("Video started");
              }}
              config={{
                youtube: {
                  playerVars: {
                    modestbranding: 1,
                    rel: 0,
                    autoplay: 0,
                  },
                },
                vimeo: {
                  playerOptions: {
                    responsive: true,
                    autoplay: false,
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

