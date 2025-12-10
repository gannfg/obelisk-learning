"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Video,
  Clock,
  Users,
  CheckCircle2,
  QrCode,
  ArrowLeft,
  ExternalLink,
  ArrowRight,
  X,
  Mail,
  Flag,
  Rocket,
  UtensilsCrossed,
  Shirt,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAdmin } from "@/lib/hooks/use-admin";
import type { Workshop } from "@/types/workshops";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";

interface Attendee {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function WorkshopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasAttended, setHasAttended] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [registrationCount, setRegistrationCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    async function loadWorkshop() {
      try {
        const response = await fetch(`/api/workshops/${workshopId}`);
        const data = await response.json();
        setWorkshop(data.workshop);

        if (user) {
          // Check registration status
          const regResponse = await fetch(`/api/workshops/${workshopId}/register`);
          const regData = await regResponse.json();
          setIsRegistered(regData.isRegistered || false);

          // Check attendance status
          const attResponse = await fetch(`/api/workshops/${workshopId}/checkin`);
          const attData = await attResponse.json();
          setHasAttended(attData.hasAttended || false);
        }

        // Fetch registrations for attendees list
        const regsResponse = await fetch(`/api/workshops/${workshopId}/registrations`);
        if (regsResponse.ok) {
          const regsData = await regsResponse.json();
          setAttendees(regsData.attendees || []);
          setRegistrationCount(regsData.count || 0);
        }
      } catch (error) {
        console.error("Error loading workshop:", error);
      } finally {
        setLoading(false);
      }
    }

    loadWorkshop();
  }, [workshopId, user, authLoading]);

  const handleRegister = async () => {
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(`/api/workshops/${workshopId}/register`, {
        method: "POST",
      });

      if (response.ok) {
        setIsRegistered(true);
        setRegistrationCount((prev) => prev + 1);
        // Reload attendees
        const regsResponse = await fetch(`/api/workshops/${workshopId}/registrations`);
        if (regsResponse.ok) {
          const regsData = await regsResponse.json();
          setAttendees(regsData.attendees || []);
        }
      } else {
        const data = await response.json();
        alert(data.error || "Failed to register");
      }
    } catch (error) {
      console.error("Error registering:", error);
      alert("Failed to register");
    } finally {
      setRegistering(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    const token = prompt("Enter QR code token:");
    if (!token) return;

    setCheckingIn(true);
    try {
      const response = await fetch(`/api/workshops/${workshopId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token }),
      });

      if (response.ok) {
        setHasAttended(true);
        alert("Successfully checked in! +100 XP awarded.");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to check in");
      }
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Failed to check in");
    } finally {
      setCheckingIn(false);
    }
  };

  const loadQRCode = async () => {
    if (!isAdmin) return;

    try {
      const response = await fetch(`/api/workshops/${workshopId}/qr`);
      const data = await response.json();
      setQrToken(data.qrToken);
      setQrCode(data.qrData);
      setShowQR(true);
    } catch (error) {
      console.error("Error loading QR code:", error);
      alert("Failed to load QR code");
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "EEEE, MMMM d");
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };

  const formatTimeRange = (startDate: Date, endDate: Date) => {
    const start = format(new Date(startDate), "h:mm a");
    const end = format(new Date(endDate), "h:mm a");
    return `${start} - ${end}`;
  };

  const getDateShort = (date: Date) => {
    const month = format(new Date(date), "MMM").toUpperCase();
    const day = format(new Date(date), "d");
    return `${month} ${day}`;
  };

  const formatDateIndonesian = (date: Date) => {
    return format(new Date(date), "EEEE, MMMM d");
  };

  const isUpcoming = workshop && new Date(workshop.datetime) > new Date();
  const isPast = workshop && new Date(workshop.datetime) < new Date();

  // Calculate end time (assuming 4 hours duration, or use actual end time if available)
  const endTime = workshop
    ? new Date(new Date(workshop.datetime).getTime() + 4 * 60 * 60 * 1000)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-8 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
            <div className="h-96 bg-muted rounded" />
            <div className="space-y-4">
              <div className="h-12 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Workshop not found</p>
            <Button asChild>
              <Link href="/workshops">Back to Workshops</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/workshops">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workshops
          </Link>
        </Button>

        <div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-6 lg:gap-12">
          {/* Left Panel - Workshop Image */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            {/* Workshop Image */}
            {workshop.imageUrl ? (
              <div className="relative w-full aspect-[3/4] sm:aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden">
                <Image
                  src={workshop.imageUrl}
                  alt={workshop.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 400px"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-full aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center">
                <p className="text-white/50 text-sm">No image available</p>
              </div>
            )}

            {/* Hosted By */}
            <div className="bg-card rounded-lg p-3 sm:p-4 border border-border">
              <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Hosted By</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Rocket className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium truncate">{workshop.hostName}</span>
                  </div>
                  <X className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div className="bg-card rounded-lg p-3 sm:p-4 border border-border">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-semibold">
                  {registrationCount} {registrationCount === 1 ? "Went" : "Went"}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {attendees.slice(0, 6).map((attendee, idx) => (
                  <div
                    key={attendee.id}
                    className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-semibold overflow-hidden"
                    style={{ marginLeft: idx > 0 ? "-8px" : "0" }}
                  >
                    {attendee.avatar ? (
                      <img
                        src={attendee.avatar}
                        alt={attendee.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{attendee.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                ))}
              </div>
              {attendees.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {attendees[0].name}
                  {attendees.length > 1 && `, ${attendees[1].name}`}
                  {attendees.length > 2 && ` and ${attendees.length - 2} others`}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`mailto:${workshop.hostName.toLowerCase().replace(/\s+/g, '')}@superteam.study`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Contact the Host
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Flag className="h-4 w-4 mr-2" />
                Report Event
              </Button>
            </div>

            {/* Hashtags */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-primary font-medium"># Workshop</span>
              <span className="text-sm text-primary font-medium"># Learning</span>
            </div>
          </div>

          {/* Right Panel - Main Content */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
                <span className="inline-block">{workshop.title}</span>
                <Rocket className="inline-block h-6 w-6 sm:h-7 sm:w-7 ml-2 text-primary align-middle" />
              </h1>
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <div className="text-base sm:text-lg font-semibold">
                {formatDateIndonesian(workshop.datetime)}
              </div>
              {endTime && (
                <div className="text-sm sm:text-base text-muted-foreground">
                  {formatTimeRange(workshop.datetime, endTime)} GMT+7
                </div>
              )}
            </div>

            {/* Location */}
            <div className="flex items-start gap-2 sm:gap-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {workshop.locationType === "online" ? (
                  <>
                    <p className="font-medium">Online Workshop</p>
                    {workshop.meetingLink && (
                      <a
                        href={workshop.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        Join Meeting <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-medium">
                      {workshop.venueName && 
                       workshop.venueName !== "View on Google Maps" && 
                       workshop.venueName !== "See Google Maps location" &&
                       workshop.venueName !== "View Location on Google Maps"
                        ? workshop.venueName
                        : "Offline Workshop"}
                    </p>
                    {(workshop as any).venueAddress && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {(workshop as any).venueAddress}
                      </p>
                    )}
                    {((workshop as any).googleMapsUrl || 
                      ((workshop as any).venueLat && (workshop as any).venueLng)) && (
                      <a
                        href={
                          (workshop as any).googleMapsUrl
                            ? (workshop as any).googleMapsUrl.startsWith("http://") ||
                              (workshop as any).googleMapsUrl.startsWith("https://")
                              ? (workshop as any).googleMapsUrl
                              : `https://${(workshop as any).googleMapsUrl}`
                            : `https://www.google.com/maps?q=${(workshop as any).venueLat},${(workshop as any).venueLng}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                      >
                        View on Map <ArrowRight className="h-3 w-3" />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Thank You Message (if registered/attended) */}
            {(isRegistered || hasAttended) && (
              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-xl font-bold mb-2">Thank You for Joining</h3>
                <p className="text-muted-foreground">
                  We hope you enjoyed the event!
                </p>
              </div>
            )}

            {/* About Event */}
            {workshop.description && (
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold">About Event</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                    {workshop.title} <Rocket className="inline-block h-4 w-4 sm:h-5 sm:w-5 ml-1 text-primary align-middle" />
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {workshop.description}
                  </p>
                </div>
              </div>
            )}

            {/* Registration & Check-in Actions */}
            {isUpcoming && (
              <div className="space-y-4 pt-6 border-t border-border">
                {!isRegistered ? (
                  <Button
                    onClick={handleRegister}
                    disabled={registering || !user}
                    className="w-full"
                    size="lg"
                  >
                    {registering
                      ? "Registering..."
                      : !user
                      ? "Sign in to Register"
                      : "Register for Workshop"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>You are registered for this workshop</span>
                  </div>
                )}

                {isRegistered && !hasAttended && (
                  <Button
                    variant="outline"
                    onClick={handleCheckIn}
                    disabled={checkingIn || !user}
                    className="w-full"
                    size="lg"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    {checkingIn ? "Checking in..." : "Check In with QR Code"}
                  </Button>
                )}

                {hasAttended && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Attendance confirmed! +100 XP awarded.</span>
                  </div>
                )}
              </div>
            )}

            {/* Admin QR Code Display */}
            {isAdmin && isUpcoming && (
              <div className="border-t border-border pt-6">
                <Button variant="outline" onClick={loadQRCode} className="w-full mb-4">
                  <QrCode className="h-4 w-4 mr-2" />
                  {showQR ? "Hide QR Code" : "Show QR Code for Check-in"}
                </Button>

                {showQR && qrCode && qrToken && (
                  <div className="bg-card rounded-lg p-6 border border-border text-center">
                    <p className="text-sm font-medium mb-4">
                      Scan this QR code to check in
                    </p>
                    <div className="flex justify-center mb-4">
                      <QRCodeSVG value={qrCode} size={200} />
                    </div>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      Token: {qrToken}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Expires: {workshop.qrExpiresAt ? formatDate(workshop.qrExpiresAt) : "After event"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {isPast && hasAttended && (
              <div className="border-t border-border pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>You attended this workshop</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
