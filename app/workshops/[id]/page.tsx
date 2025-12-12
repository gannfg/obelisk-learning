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

  const handleCheckIn = () => {
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    if (!workshop?.qrToken) {
      alert("QR code not available for this workshop");
      return;
    }

    // Redirect to check-in page for scanning
    router.push(`/checkin/${workshop.qrToken}`);
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

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-24 md:pb-10 max-w-7xl">
        <Button variant="ghost" asChild className="mb-4 sm:mb-6 lg:mb-8">
          <Link href="/workshops">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workshops
          </Link>
        </Button>

        <div className="flex flex-col lg:grid lg:grid-cols-[420px_1fr] gap-6 sm:gap-8 lg:gap-12">
          {/* Left Panel - Desktop Sidebar */}
          <div className="hidden lg:flex lg:flex-col space-y-6">
            {/* Workshop Image - Desktop only */}
            {workshop.imageUrl ? (
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src={workshop.imageUrl}
                  alt={workshop.title}
                  fill
                  className="object-cover"
                  sizes="420px"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center shadow-lg">
                <p className="text-white/50 text-sm">No image available</p>
              </div>
            )}

            {/* Actions - Desktop only */}
            <div className="space-y-3">
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

            {/* Hashtags - Desktop only */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-sm text-primary font-medium"># Workshop</span>
              <span className="text-sm text-primary font-medium"># Learning</span>
            </div>
          </div>

          {/* Main Content - Mobile & Desktop */}
          <div className="flex flex-col space-y-5 sm:space-y-6 lg:space-y-8">
            {/* 1. Image - Mobile only */}
            <div className="lg:hidden -mx-4 sm:-mx-6 sm:mx-0">
              {workshop.imageUrl ? (
                <div className="relative w-full aspect-[16/10] sm:aspect-[3/2] rounded-lg sm:rounded-xl overflow-hidden shadow-md">
                  <Image
                    src={workshop.imageUrl}
                    alt={workshop.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                </div>
              ) : (
                <div className="relative w-full aspect-[16/10] sm:aspect-[3/2] rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center shadow-md">
                  <p className="text-white/50 text-sm">No image available</p>
                </div>
              )}
            </div>

            {/* 2. Title */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
                {workshop.title}
              </h1>
            </div>

            {/* 3. Hosted By */}
            <div className="bg-card rounded-lg p-4 sm:p-5 border border-border shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Hosted By</h3>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base font-medium truncate">{workshop.hostName}</span>
                </div>
              </div>
            </div>

            {/* 4. Date & Time */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <div className="text-base sm:text-lg font-semibold">
                    {formatDateIndonesian(workshop.datetime)}
                  </div>
                  {endTime && (
                    <div className="text-sm sm:text-base text-muted-foreground mt-0.5">
                      {formatTimeRange(workshop.datetime, endTime)} GMT+7
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Location */}
            <div className="bg-card rounded-lg p-4 sm:p-5 border border-border shadow-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {workshop.locationType === "online" ? (
                    <>
                      <p className="font-semibold text-base mb-1">Online Workshop</p>
                      {workshop.meetingLink && (
                        <a
                          href={workshop.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1.5 mt-2 inline-flex"
                        >
                          Join Meeting <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-base mb-1">
                        {workshop.venueName && 
                         workshop.venueName !== "View on Google Maps" && 
                         workshop.venueName !== "See Google Maps location" &&
                         workshop.venueName !== "View Location on Google Maps"
                          ? workshop.venueName
                          : "Offline Workshop"}
                      </p>
                      {(workshop as any).venueAddress && (
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
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
                          className="text-sm text-primary hover:underline flex items-center gap-1.5 mt-2.5 inline-flex"
                        >
                          View on Map <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 6. Thank You Message (if registered/attended) */}
            {(isRegistered || hasAttended) && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-5 sm:p-6 border border-green-500/20 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1.5 text-green-700 dark:text-green-300">Thank You for Joining</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      We hope you enjoyed the event!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. About Event */}
            {workshop.description && (
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold">About Event</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {workshop.description}
                  </p>
                </div>
              </div>
            )}

            {/* 8. Participants/Attendees */}
            <div className="bg-card rounded-lg p-4 sm:p-5 border border-border shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                {registrationCount} {registrationCount === 1 ? "Participant" : "Participants"}
              </h3>
              {attendees.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-3 -ml-1">
                    {attendees.slice(0, 8).map((attendee, idx) => (
                      <div
                        key={attendee.id}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-semibold overflow-hidden shadow-sm"
                        style={{ marginLeft: idx > 0 ? "-8px" : "0" }}
                      >
                        {attendee.avatar ? (
                          <img
                            src={attendee.avatar}
                            alt={attendee.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs">{attendee.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    ))}
                    {attendees.length > 8 && (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-semibold">
                        +{attendees.length - 8}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {attendees[0].name}
                    {attendees.length > 1 && `, ${attendees[1].name}`}
                    {attendees.length > 2 && ` and ${attendees.length - 2} others`}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No participants yet</p>
              )}
            </div>

            {/* Registration & Check-in Actions */}
            {isUpcoming && (
              <div className="space-y-4 pt-4 border-t border-border">
                {!isRegistered ? (
                  <Button
                    onClick={handleRegister}
                    disabled={registering || !user}
                    className="w-full h-12 text-base font-semibold"
                    size="lg"
                  >
                    {registering
                      ? "Registering..."
                      : !user
                      ? "Sign in to Register"
                      : "Register for Workshop"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 text-sm sm:text-base text-green-600 dark:text-green-400 p-4 sm:p-5 bg-green-500/10 rounded-lg border border-green-500/20 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <span className="font-medium">You are registered for this workshop</span>
                  </div>
                )}

                {isRegistered && !hasAttended && (
                  <Button
                    variant="outline"
                    onClick={handleCheckIn}
                    disabled={!user || !workshop?.qrToken}
                    className="w-full hidden md:flex h-12 text-base font-semibold"
                    size="lg"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Check In with QR Code
                  </Button>
                )}

                {hasAttended && (
                  <div className="flex items-center gap-3 text-sm sm:text-base text-green-600 dark:text-green-400 p-4 sm:p-5 bg-green-500/10 rounded-lg border border-green-500/20 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <span className="font-medium">Attendance confirmed! +100 XP awarded.</span>
                  </div>
                )}
              </div>
            )}

            {isPast && hasAttended && (
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-3 text-sm sm:text-base text-muted-foreground p-4 sm:p-5 bg-muted/50 rounded-lg shadow-sm">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                  <span className="font-medium">You attended this workshop</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Check-in Button - Above Mobile Nav (Mobile Only) */}
        {isUpcoming && isRegistered && !hasAttended && (
          <div 
            className="fixed md:hidden bottom-20 left-4 right-4 z-[60] max-w-md mx-auto transition-all duration-300 ease-in-out"
            style={{ 
              bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))'
            }}
          >
            <Button
              onClick={handleCheckIn}
              disabled={!user || !workshop?.qrToken}
              className="w-full h-14 text-base font-semibold rounded-xl px-6 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                         bg-background/80 dark:bg-background/60 backdrop-blur-xl
                         border border-border/50 dark:border-border/30
                         shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]
                         hover:bg-background/90 dark:hover:bg-background/70
                         hover:border-border/70 dark:hover:border-border/50
                         hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.45)] dark:hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.6)]
                         text-foreground"
              size="lg"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Check In with QR Code
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
