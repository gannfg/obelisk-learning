"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useAuth } from "@/lib/hooks/use-auth";
import { ArrowLeft, CheckCircle2, QrCode, UserPlus, Download, Copy } from "lucide-react";
import { format } from "date-fns";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { QRCodeSVG } from "qrcode.react";

interface AttendanceRecord {
  id: string;
  userId: string;
  checkinTime: Date;
  method: "qr" | "manual";
  user: {
    email: string;
    username?: string;
    name: string;
  } | null;
}

export default function WorkshopAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.id as string;
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user, loading: authLoading } = useAuth();

  const [workshop, setWorkshop] = useState<any>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualCheckInEmail, setManualCheckInEmail] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.replace("/");
      return;
    }
    if (!adminLoading && isAdmin && !authLoading) {
      loadData();
    }
  }, [isAdmin, adminLoading, authLoading, router]);

  const loadData = async () => {
    try {
      const [workshopRes, attendanceRes] = await Promise.all([
        fetch(`/api/workshops/${workshopId}`),
        fetch(`/api/workshops/${workshopId}/attendance`),
      ]);

      const workshopData = await workshopRes.json();
      const attendanceData = await attendanceRes.json();

      setWorkshop(workshopData.workshop);
      setAttendance(attendanceData.attendance || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualCheckInEmail.trim() || !user) return;

    setCheckingIn(true);
    try {
      // Find user by email
      const learningSupabase = createLearningClient();
      if (!learningSupabase) {
        alert("Supabase client not configured.");
        return;
      }
      const { data: userData } = await learningSupabase
        .from("users")
        .select("id")
        .eq("email", manualCheckInEmail.trim())
        .single();

      if (!userData) {
        alert("User not found");
        return;
      }

      const response = await fetch(`/api/workshops/${workshopId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          isManual: true,
        }),
      });

      if (response.ok) {
        setManualCheckInEmail("");
        await loadData();
        alert("User checked in successfully");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to check in user");
      }
    } catch (error) {
      console.error("Error with manual check-in:", error);
      alert("Failed to check in user");
    } finally {
      setCheckingIn(false);
    }
  };

  if (adminLoading || authLoading || loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/admin/workshops">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workshops
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{workshop?.title || "Workshop Attendance"}</CardTitle>
          <CardDescription>
            Manage attendance for this workshop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Display */}
          {workshop?.qrToken && (
            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code for Check-in
              </h3>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0 bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${workshop.qrToken}`}
                    size={200}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Check-in URL:</p>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${workshop.qrToken}`}
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${workshop.qrToken}`
                          );
                          alert("URL copied to clipboard!");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this QR code with attendees. They can scan it to check in to the workshop.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Check-in */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Manual Check-in
            </h3>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter user email"
                value={manualCheckInEmail}
                onChange={(e) => setManualCheckInEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && manualCheckInEmail.trim() && !checkingIn) {
                    handleManualCheckIn();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleManualCheckIn}
                disabled={checkingIn || !manualCheckInEmail.trim()}
              >
                {checkingIn ? "Checking in..." : "Check In"}
              </Button>
            </div>
          </div>

          {/* Export CSV */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/workshops/${workshopId}/attendance`);
                  if (!response.ok) throw new Error("Failed to fetch attendance");
                  const data = await response.json();
                  
                  const headers = ["Name", "Email", "Check-in Time", "Method"];
                  const rows = data.attendance.map((att: any) => [
                    att.user?.name || "Unknown",
                    att.user?.email || "Unknown",
                    format(new Date(att.checkinTime), "yyyy-MM-dd HH:mm:ss"),
                    att.method === "qr" ? "QR Code" : "Manual",
                  ]);

                  const csv = [headers, ...rows]
                    .map((row) => row.map((cell: any) => `"${cell}"`).join(","))
                    .join("\n");

                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `workshop-attendance-${workshopId}-${format(new Date(), "yyyy-MM-dd")}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (error) {
                  console.error("Error exporting attendance:", error);
                  alert("Failed to export attendance");
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Attendance List */}
          <div>
            <h3 className="font-semibold mb-4">
              Attendance ({attendance.length})
            </h3>
            {attendance.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No attendance recorded yet
              </p>
            ) : (
              <div className="space-y-2">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {record.user?.name || record.user?.email || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.user?.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(record.checkinTime), "MMM d, yyyy 'at' h:mm a")} •{" "}
                          {record.method === "qr" ? (
                            <span className="flex items-center gap-1">
                              <QrCode className="h-3 w-3" />
                              QR Code
                            </span>
                          ) : (
                            "Manual"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

