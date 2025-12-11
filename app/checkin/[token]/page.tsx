"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAdmin } from "@/lib/hooks/use-admin";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Camera, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

type CheckInStatus = "idle" | "scanning" | "checking" | "success" | "error";

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [status, setStatus] = useState<CheckInStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [workshopTitle, setWorkshopTitle] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerStarted, setScannerStarted] = useState(false);

  const loadWorkshopInfo = async () => {
    try {
      const response = await fetch(`/api/attendance/verify-token?token=${token}`);
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Invalid check-in token");
        setStatus("error");
        return;
      }
      const data = await response.json();
      setWorkshopTitle(data.workshop?.title || null);
    } catch (error) {
      console.error("Error loading workshop info:", error);
      setError("Failed to load workshop information");
      setStatus("error");
    }
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setStatus("idle");
  }, []);

  const handleQRScan = useCallback(async (scannedData: string) => {
    if (status !== "scanning") return;

    // Stop scanning immediately
    await stopScanner();
    setStatus("checking");

    try {
      // Parse the scanned data - could be URL or JSON
      let checkInToken = token;
      
      // If scanned data is a URL, extract token
      if (scannedData.includes("/checkin/")) {
        const urlParts = scannedData.split("/checkin/");
        if (urlParts.length > 1) {
          checkInToken = urlParts[1].split("?")[0].split("#")[0];
        }
      } else if (scannedData.startsWith("http")) {
        // Try to extract from full URL
        try {
          const url = new URL(scannedData);
          const pathParts = url.pathname.split("/");
          const tokenIndex = pathParts.indexOf("checkin");
          if (tokenIndex >= 0 && tokenIndex < pathParts.length - 1) {
            checkInToken = pathParts[tokenIndex + 1];
          }
        } catch {
          // If URL parsing fails, use the token from URL params
        }
      }

      // Verify token matches
      if (checkInToken !== token) {
        setError("QR code does not match this check-in page");
        setStatus("error");
        return;
      }

      // Submit check-in
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: checkInToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to check in");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch (error: any) {
      console.error("Error processing QR scan:", error);
      setError(error.message || "Failed to process check-in");
      setStatus("error");
    }
  }, [status, token, stopScanner]);

  const startScanner = useCallback(async () => {
    if (!user) return;

    try {
      setStatus("scanning");
      setError(null);
      setCameraError(null);

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      // Start scanning
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleQRScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent and normal)
        }
      );
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Failed to access camera");
      setStatus("idle");
      scannerRef.current = null;
    }
  }, [user, handleQRScan]);

  useEffect(() => {
    if (authLoading || adminLoading) return;

    if (!user) {
      router.push(`/auth/sign-in?redirect=/checkin/${token}`);
      return;
    }

    // Check if user is admin - admins cannot check in
    if (isAdmin) {
      setError("Admins cannot check in using QR code. Please use the admin panel for manual check-in.");
      setStatus("error");
      return;
    }

    // Load workshop info
    loadWorkshopInfo();

    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
          })
          .catch(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [user, authLoading, adminLoading, isAdmin, token, router]);

  // Auto-start scanner after workshop info is loaded
  useEffect(() => {
    if (workshopTitle && !isAdmin && !scannerStarted && status === "idle" && user) {
      setScannerStarted(true);
      startScanner();
    }
  }, [workshopTitle, isAdmin, scannerStarted, status, user, startScanner]);


  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/workshops">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workshops
          </Link>
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">Workshop Check-In</h1>
              {workshopTitle && (
                <p className="text-lg text-muted-foreground">{workshopTitle}</p>
              )}
            </div>

            {status === "idle" && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Camera will start automatically. Please allow camera access when prompted.
                  </p>
                  <Button
                    onClick={startScanner}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Start QR Scanner
                  </Button>
                </div>
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}
              </div>
            )}

            {status === "scanning" && (
              <div className="space-y-4">
                <div className="relative">
                  <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
                </div>
                <Button
                  onClick={stopScanner}
                  variant="outline"
                  className="w-full"
                >
                  Cancel Scanning
                </Button>
                {cameraError && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-500">{cameraError}</p>
                  </div>
                )}
              </div>
            )}

            {status === "checking" && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-lg">Processing check-in...</p>
              </div>
            )}

            {status === "success" && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Check-In Successful!</h2>
                <p className="text-muted-foreground mb-6">
                  Your attendance has been recorded. You&apos;ve earned +100 XP!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <Link href="/workshops">Back to Workshops</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/profile">View Profile</Link>
                  </Button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {isAdmin ? "Check-In Not Available" : "Check-In Failed"}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {error || "An error occurred while processing your check-in"}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!isAdmin && (
                    <Button onClick={() => {
                      setStatus("idle");
                      setError(null);
                      setScannerStarted(false);
                    }}>
                      Try Again
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link href="/workshops">Back to Workshops</Link>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

