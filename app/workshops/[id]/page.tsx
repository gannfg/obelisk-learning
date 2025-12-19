"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  QrCode,
  ArrowLeft,
  ExternalLink,
  Mail,
  Flag,
  Rocket,
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl animate-pulse">
          <div className="h-10 bg-muted/50 rounded-lg w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-16">
            {/* Sidebar skeleton */}
            <div className="hidden lg:block">
              <div className="h-[500px] bg-muted/50 rounded-lg mb-6" />
            </div>
            {/* Main content skeleton */}
            <div className="space-y-8">
              <div className="h-64 lg:hidden bg-muted/50 rounded-lg" />
              <div className="h-12 bg-muted/50 rounded-lg w-3/4" />
              <div className="h-32 bg-muted/50 rounded-lg" />
              <div className="h-24 bg-muted/50 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-3">Workshop Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The workshop you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild size="lg" className="group">
            <Link href="/workshops">
              <ArrowLeft className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="opacity-70 group-hover:opacity-100 transition-opacity">Back to Workshops</span>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-24 md:pb-10 max-w-7xl">
        <Button 
          variant="ghost" 
          asChild 
          className="mb-8 group transition-all"
        >
          <Link href="/workshops">
            <ArrowLeft className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">Back to Workshops</span>
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-16">
          {/* Left Panel - Desktop Sidebar (Sticky) */}
          <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
            {workshop.imageUrl ? (
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                <Image
                  src={workshop.imageUrl}
                  alt={workshop.title}
                  fill
                  className="object-cover"
                  sizes="380px"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center">
                <Rocket className="h-16 w-16 text-white/30" />
              </div>
            )}
            
            {/* Host Information - Desktop only */}
            <div className="mt-6 space-y-3 p-5 rounded-lg border border-border/50 bg-card/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hosted By</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-medium">{workshop.hostName}</span>
              </div>
            </div>

            {/* Participants - Desktop only */}
            <div className="mt-6 space-y-3 p-5 rounded-lg border border-border/50 bg-card/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {registrationCount} {registrationCount === 1 ? "Participant" : "Participants"}
              </h3>
              {attendees.length > 0 ? (
                <>
                  <div className="flex items-center -space-x-2">
                    {attendees.slice(0, 10).map((attendee) => (
                      <div
                        key={attendee.id}
                        className="w-10 h-10 rounded-full bg-primary/5 border-2 border-background/80 flex items-center justify-center text-xs font-semibold overflow-hidden"
                        title={attendee.name}
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
                    {attendees.length > 10 && (
                      <div className="w-10 h-10 rounded-full bg-muted/30 border-2 border-background/80 flex items-center justify-center text-xs font-semibold">
                        +{attendees.length - 10}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {attendees[0].name}
                    {attendees.length > 1 && `, ${attendees[1].name}`}
                    {attendees.length > 2 && ` and ${attendees.length - 2} others`}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No participants yet</p>
              )}
            </div>

            {/* Secondary Actions - Desktop only */}
            <div className="mt-6 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start h-9 text-sm group transition-all border-border/50" 
                asChild
              >
                <Link href={`mailto:${workshop.hostName.toLowerCase().replace(/\s+/g, '')}@superteam.study`}>
                  <Mail className="h-3.5 w-3.5 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">Contact Host</span>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-9 text-sm group transition-all border-border/50"
              >
                <Flag className="h-3.5 w-3.5 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="opacity-70 group-hover:opacity-100 transition-opacity">Report Event</span>
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Hero Section - Mobile Image */}
            <div className="lg:hidden -mx-4 sm:mx-0">
              {workshop.imageUrl ? (
                <div className="relative w-full aspect-[16/9] rounded-none sm:rounded-lg overflow-hidden">
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
                <div className="relative w-full aspect-[16/9] rounded-none sm:rounded-lg overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center">
                  <Rocket className="h-16 w-16 text-white/30" />
                </div>
              )}
            </div>

            {/* Title with Status Badge */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                {workshop.title}
              </h1>
              {(isRegistered || hasAttended) && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/5 border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {hasAttended ? "Attended" : "Registered"}
                  </span>
                </div>
              )}
            </div>

            {/* Event Details - Unified Card */}
            <div className="grid md:grid-cols-2 gap-6 p-6 rounded-lg border border-border/50 bg-card/50">
              {/* Date & Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Date & Time</span>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {formatDateIndonesian(workshop.datetime)}
                  </p>
                  {endTime && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatTimeRange(workshop.datetime, endTime)} GMT+7
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Location</span>
                </div>
                <div>
                  {workshop.locationType === "online" ? (
                    <>
                      <p className="text-lg font-semibold">Online Workshop</p>
                      {workshop.meetingLink && (
                        <a
                          href={workshop.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 mt-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          Join Meeting <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold">
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
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 mt-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded"
                        >
                          View on Map <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Registration CTA */}
            {isUpcoming && !isRegistered && (
              <Button
                onClick={handleRegister}
                disabled={registering || !user}
                className="w-full h-14 text-lg font-semibold group transition-all"
                size="lg"
              >
                {registering
                  ? "Registering..."
                  : !user
                  ? "Sign in to Register"
                  : "Register for Workshop"}
              </Button>
            )}

            {/* Past Workshop Message */}
            {isPast && !hasAttended && (
              <div className="p-5 rounded-lg border border-border/50 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  This workshop has ended. Check out our upcoming workshops!
                </p>
              </div>
            )}

            {/* Host Information - Mobile only */}
            <div className="lg:hidden p-5 rounded-lg border border-border/50 bg-card/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Hosted By</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-medium">{workshop.hostName}</span>
              </div>
            </div>

            {/* Participants - Mobile only */}
            <div className="lg:hidden p-5 rounded-lg border border-border/50 bg-card/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {registrationCount} {registrationCount === 1 ? "Participant" : "Participants"}
              </h3>
              {attendees.length > 0 ? (
                <>
                  <div className="flex items-center -space-x-2 mb-3">
                    {attendees.slice(0, 10).map((attendee) => (
                      <div
                        key={attendee.id}
                        className="w-10 h-10 rounded-full bg-primary/5 border-2 border-background/80 flex items-center justify-center text-xs font-semibold overflow-hidden"
                        title={attendee.name}
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
                    {attendees.length > 10 && (
                      <div className="w-10 h-10 rounded-full bg-muted/30 border-2 border-background/80 flex items-center justify-center text-xs font-semibold">
                        +{attendees.length - 10}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {attendees[0].name}
                    {attendees.length > 1 && `, ${attendees[1].name}`}
                    {attendees.length > 2 && ` and ${attendees.length - 2} others`}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No participants yet</p>
              )}
            </div>

            {/* About Event */}
            {workshop.description && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">About Event</h2>
                <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {workshop.description}
                </p>
              </div>
            )}

            {/* Check-in Action - Desktop only */}
            {isUpcoming && isRegistered && !hasAttended && (
              <Button
                variant="outline"
                onClick={handleCheckIn}
                disabled={!user || !workshop?.qrToken}
                className="w-full hidden md:flex h-12 text-base font-semibold group transition-all border-border/50"
                size="lg"
              >
                <QrCode className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="opacity-70 group-hover:opacity-100 transition-opacity">Check In with QR Code</span>
              </Button>
            )}

            {/* Attendance Confirmation */}
            {hasAttended && (
              <div className="flex items-center gap-3 p-5 bg-green-500/5 rounded-lg border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Attendance confirmed! +100 XP awarded.
                </span>
              </div>
            )}

            {/* Secondary Actions - Mobile only */}
            <div className="lg:hidden space-y-2 pt-4 border-t border-border/50">
              <Button 
                variant="outline" 
                className="w-full justify-start group transition-all border-border/50" 
                asChild
              >
                <Link href={`mailto:${workshop.hostName.toLowerCase().replace(/\s+/g, '')}@superteam.study`}>
                  <Mail className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">Contact Host</span>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start group transition-all border-border/50"
              >
                <Flag className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="opacity-70 group-hover:opacity-100 transition-opacity">Report Event</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Check-in Button - Mobile only */}
        {isUpcoming && isRegistered && !hasAttended && (
          <div 
            className="fixed md:hidden bottom-20 left-0 right-0 z-[60] pointer-events-none"
            style={{ 
              bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))'
            }}
          >
            {/* Background gradient fade */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
            
            {/* Button container */}
            <div className="relative px-4 pb-2 pointer-events-auto">
              <Button
                onClick={handleCheckIn}
                disabled={!user || !workshop?.qrToken}
                className="w-full h-14 text-base font-semibold rounded-lg shadow-md group transition-all disabled:opacity-50 disabled:cursor-not-allowed border-border/50 bg-background/95 backdrop-blur-sm text-black dark:text-white"
                size="lg"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Check In with QR Code
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
