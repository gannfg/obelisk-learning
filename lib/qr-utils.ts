/**
 * QR Code Utilities for Workshop Check-in
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Generate a unique QR token for workshop check-in
 */
export function generateQRToken(): string {
  return uuidv4();
}

/**
 * Get the base URL for the application
 * Uses NEXT_PUBLIC_APP_URL if set, otherwise falls back to window.location.origin (client-side only)
 */
export function getBaseUrl(): string {
  // First, try environment variable (for production/staging)
  // NEXT_PUBLIC_ variables are available on both client and server in Next.js
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (envUrl) {
    // Remove trailing slash if present
    return envUrl.replace(/\/$/, "");
  }
  
  // Client-side fallback
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  
  // Server-side fallback (shouldn't happen in most cases)
  return "";
}

/**
 * Generate the check-in URL for a QR token
 */
export function getCheckInUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || getBaseUrl();
  if (!base) {
    console.warn("No base URL available for check-in URL generation");
    return `/checkin/${token}`;
  }
  return `${base}/checkin/${token}`;
}

/**
 * Parse token from a check-in URL
 */
export function parseTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const checkInIndex = pathParts.indexOf("checkin");
    
    if (checkInIndex >= 0 && checkInIndex < pathParts.length - 1) {
      return pathParts[checkInIndex + 1].split("?")[0].split("#")[0];
    }
  } catch {
    // If URL parsing fails, try regex
    const match = url.match(/\/checkin\/([^/?]+)/);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

