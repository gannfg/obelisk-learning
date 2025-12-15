"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAdmin } from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Camera, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

type Html5QrcodeType = any;
type CheckInStatus = "idle" | "initializing" | "scanning" | "checking" | "success" | "error";

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [status, setStatus] = useState<CheckInStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [workshopTitle, setWorkshopTitle] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const qrReaderRef = useRef<HTMLDivElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerStarted, setScannerStarted] = useState(false);
  const initAttemptedRef = useRef(false);

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
      // Parse the scanned data - could be URL, JSON, or plain token
      let checkInToken: string | null = null;
      
      // Try to parse as JSON first (workshop QR codes may be JSON)
      try {
        const jsonData = JSON.parse(scannedData);
        if (jsonData.qrToken) {
          checkInToken = jsonData.qrToken;
        } else if (jsonData.token) {
          checkInToken = jsonData.token;
        }
      } catch {
        // Not JSON, continue with other parsing methods
      }

      // If not found in JSON, try to extract from URL
      if (!checkInToken) {
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
            // If URL parsing fails, continue
          }
        } else {
          // Assume the scanned data is the token itself
          checkInToken = scannedData.trim();
        }
      }

      if (!checkInToken) {
        setError("Could not extract check-in token from QR code");
        setStatus("error");
        return;
      }

      // Submit check-in - API will validate if it's a valid attendance QR
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
  }, [status, stopScanner]);

  const startScanner = useCallback(async () => {
    if (!user || scannerRef.current || initAttemptedRef.current) return;

    try {
      setError(null);
      setCameraError(null);
      setStatus("initializing");
      initAttemptedRef.current = true;

      // Wait for React to render the element - use requestAnimationFrame for next render cycle
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      // Wait for element to appear (with timeout)
      let element: HTMLElement | null = null;
      for (let i = 0; i < 10; i++) {
        element = document.getElementById("qr-reader");
        if (element) break;
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (!element) {
        throw new Error("Scanner element not found after rendering");
      }

      // Import and initialize scanner
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      const scanner: Html5QrcodeType = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      // Get available cameras
      let cameraId: string | undefined;
      try {
        const cameras = await Html5Qrcode.getCameras();
        // Prefer back camera (environment facing)
        const backCamera = cameras.find((cam: any) => 
          cam.label?.toLowerCase().includes("back") || 
          cam.label?.toLowerCase().includes("rear") ||
          cam.label?.toLowerCase().includes("environment")
        );
        cameraId = backCamera?.id || cameras[0]?.id;
      } catch (err) {
        console.warn("Could not enumerate cameras, using facingMode:", err);
      }

      // Start scanner with optimized settings
      await scanner.start(
        cameraId 
          ? { deviceId: { exact: cameraId } } 
          : { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText: string) => {
          handleQRScan(decodedText);
        },
        () => {
          // Ignore scanning errors (they're frequent and normal)
        }
      );

      setStatus("scanning");
    } catch (err: any) {
      console.error("Scanner initialization error:", err);
      
      // Clean up on error
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop().catch(() => {});
        } catch {}
        scannerRef.current = null;
      }
      
      initAttemptedRef.current = false;
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera found. Please connect a camera device.");
      } else if (err.message?.includes("element")) {
        setCameraError("Failed to initialize scanner. Please refresh the page.");
      } else {
        setCameraError(err.message || "Failed to start camera. Please try again.");
      }
      setStatus("idle");
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
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        startScanner();
      });
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
                    onClick={() => {
                      initAttemptedRef.current = false;
                      startScanner();
                    }}
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

            {(status === "initializing" || status === "scanning") && (
              <div className="space-y-4">
                <div className="relative min-h-[320px] bg-black rounded-lg overflow-hidden">
                  <div 
                    id="qr-reader" 
                    ref={qrReaderRef}
                    className="w-full rounded-lg overflow-hidden min-h-[320px]" 
                  />
                  {status === "initializing" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-sm font-medium">Initializing camera...</p>
                        <p className="text-xs text-muted-foreground mt-1">Please allow camera access</p>
                      </div>
                    </div>
                  )}
                </div>
                {status === "scanning" && (
                  <Button
                    onClick={stopScanner}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel Scanning
                  </Button>
                )}
                {cameraError && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
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
                      setCameraError(null);
                      setScannerStarted(false);
                      initAttemptedRef.current = false;
                      if (scannerRef.current) {
                        scannerRef.current.stop().catch(() => {});
                        scannerRef.current = null;
                      }
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

