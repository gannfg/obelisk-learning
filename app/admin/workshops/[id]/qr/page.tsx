"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useAuth } from "@/lib/hooks/use-auth";
import { ArrowLeft, QrCode, Copy, Download, Printer, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import type { Workshop } from "@/types/workshops";
import { getCheckInUrl } from "@/lib/qr-utils";

export default function WorkshopQRPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.id as string;
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user, loading: authLoading } = useAuth();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInUrl, setCheckInUrl] = useState<string>("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.replace("/");
      return;
    }
    if (!adminLoading && isAdmin && !authLoading) {
      loadWorkshop();
    }
  }, [isAdmin, adminLoading, authLoading, router]);

  const loadWorkshop = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workshops/${workshopId}`);
      if (!response.ok) {
        setError("Failed to load workshop");
        return;
      }
      const data = await response.json();
      setWorkshop(data.workshop);

      if (data.workshop?.qrToken) {
        setCheckInUrl(getCheckInUrl(data.workshop.qrToken));
      }
    } catch (err) {
      console.error("Error loading workshop:", err);
      setError("Failed to load workshop");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(checkInUrl);
    // You could use a toast here instead
    alert("Check-in URL copied to clipboard!");
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `workshop-qr-${workshopId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  if (adminLoading || authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error || "Workshop not found"}</p>
              <Button asChild>
                <Link href="/admin/workshops">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workshops
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workshop.qrToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">QR code not available for this workshop</p>
              <Button asChild>
                <Link href="/admin/workshops">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workshops
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = workshop.qrExpiresAt && new Date(workshop.qrExpiresAt) < new Date();
  const isExpiringSoon = workshop.qrExpiresAt && 
    new Date(workshop.qrExpiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000; // Less than 24 hours

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin/workshops">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workshops
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">QR Code Management</h1>
          <p className="text-muted-foreground mt-2">{workshop.title}</p>
        </div>

        {/* Workshop Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Workshop Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(workshop.datetime), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Host: {workshop.hostName}
              </span>
            </div>
            {workshop.qrExpiresAt && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  QR Code expires: {format(new Date(workshop.qrExpiresAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
                {isExpired && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-200 px-2 py-1 rounded">
                    Expired
                  </span>
                )}
                {!isExpired && isExpiringSoon && (
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200 px-2 py-1 rounded">
                    Expiring Soon
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Check-in QR Code
                </CardTitle>
                <CardDescription className="mt-2">
                  Share this QR code with attendees to check in to the workshop
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="hidden print:block">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code Display */}
            <div className="flex flex-col items-center justify-center space-y-4 print:py-8">
              <div className="bg-white p-6 rounded-lg shadow-lg print:shadow-none">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={checkInUrl}
                  size={300}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium mb-1">{workshop.title}</p>
                <p className="text-xs text-muted-foreground">
                  Scan to check in
                </p>
              </div>
            </div>

            {/* Check-in URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-in URL</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={checkInUrl}
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this URL directly if QR code scanning is not available
              </p>
            </div>

            {/* Instructions */}
            <div className="border-t pt-4 space-y-2">
              <h3 className="text-sm font-semibold">How to use:</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Display this QR code on a screen or print it out</li>
                <li>Attendees scan the QR code with their phone camera</li>
                <li>They will be redirected to the check-in page</li>
                <li>Attendance is automatically recorded when they scan</li>
              </ol>
            </div>

            {/* Status Warning */}
            {isExpired && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-900 dark:text-red-200">
                  ⚠️ This QR code has expired and can no longer be used for check-in.
                </p>
              </div>
            )}
            {!isExpired && isExpiringSoon && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-900 dark:text-yellow-200">
                  ⚠️ This QR code will expire soon. Make sure to use it before the expiration time.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-end">
          <Button variant="outline" asChild>
            <Link href={`/admin/workshops/${workshopId}/attendance`}>
              View Attendance
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/workshops">
              Back to Workshops
            </Link>
          </Button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

