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
 * Generate the check-in URL for a QR token
 */
export function getCheckInUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
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

