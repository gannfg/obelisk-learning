"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MapPin,
  Video,
  Users,
  Search,
  Plus,
} from "lucide-react";
import type { Workshop } from "@/types/workshops";
import { format, isSameDay, parseISO } from "date-fns";
import Image from "next/image";
import { WorkshopCalendar } from "@/components/workshop-calendar";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAdmin } from "@/lib/hooks/use-admin";

export default function WorkshopsPage() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [locationFilter, setLocationFilter] = useState<"all" | "online" | "offline">("all");
  const [myWorkshops, setMyWorkshops] = useState<{
    attending: Workshop[];
    attended: Workshop[];
  }>({ attending: [], attended: [] });
  const [myWorkshopsLoading, setMyWorkshopsLoading] = useState(false);
  const [myWorkshopsTab, setMyWorkshopsTab] = useState<"attending" | "attended">("attending");

  useEffect(() => {
    async function loadWorkshops() {
      try {
        setLoading(true);
        let url = "/api/workshops";
        if (filter === "upcoming") {
          url += "?upcomingOnly=true";
        } else if (filter === "past") {
          url += "?upcomingOnly=false";
        }

        const response = await fetch(url);
        if (!response.ok) {
          console.error("Failed to fetch workshops:", response.status, response.statusText);
          return;
        }
        const data = await response.json();
        setWorkshops(data.workshops || []);
      } catch (error) {
        console.error("Error loading workshops:", error);
      } finally {
        setLoading(false);
      }
    }

    loadWorkshops();
  }, [filter]);

  useEffect(() => {
    async function loadMyWorkshops() {
      if (!user) {
        setMyWorkshops({ attending: [], attended: [] });
        return;
      }

      try {
        setMyWorkshopsLoading(true);
        const response = await fetch("/api/workshops/my-registrations");
        if (!response.ok) {
          console.error("Failed to fetch my workshops:", response.status);
          return;
        }
        const data = await response.json();
        setMyWorkshops({
          attending: data.attending || [],
          attended: data.attended || [],
        });
      } catch (error) {
        console.error("Error loading my workshops:", error);
      } finally {
        setMyWorkshopsLoading(false);
      }
    }

    loadMyWorkshops();
  }, [user]);


  // Format date like "Dec 12 Friday"
  const formatDateLabel = (date: Date) => {
    const month = format(date, "MMM");
    const day = format(date, "d");
    const weekday = format(date, "EEEE");
    return `${month} ${day} ${weekday}`;
  };

  // Filter workshops by selected date and country
  const filteredWorkshops = useMemo(() => {
    let filtered = workshops;

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter((workshop) => {
        const workshopDate = new Date(workshop.datetime);
        return isSameDay(workshopDate, selectedDate);
      });
    }

    // Filter by location type
    if (locationFilter !== "all") {
      filtered = filtered.filter((workshop) => {
        if (locationFilter === "online") {
          return workshop.locationType === "online";
        }
        if (locationFilter === "offline") {
          return workshop.locationType === "offline";
        }
        return false;
      });
    }

    // Group by date
    const grouped = filtered.reduce((acc, workshop) => {
      const date = new Date(workshop.datetime);
      const dateLabel = formatDateLabel(date);
      if (!acc[dateLabel]) {
        acc[dateLabel] = [];
      }
      acc[dateLabel].push(workshop);
      return acc;
    }, {} as Record<string, Workshop[]>);

    return grouped;
  }, [workshops, selectedDate, locationFilter]);

  const formatTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };

  const formatTimeRange = (startDate: Date, endDate: Date) => {
    const start = formatTime(startDate);
    const end = formatTime(endDate);
    return `${start} - ${end}`;
  };

  // Calculate end time (assuming 4 hours duration)
  const getEndTime = (startDate: Date) => {
    return new Date(new Date(startDate).getTime() + 4 * 60 * 60 * 1000);
  };

  // Get country code from venue name or location type
  const getCountryCode = (workshop: Workshop): string => {
    if (workshop.locationType === "online") return "Online";
    if (workshop.venueName) {
      const parts = workshop.venueName.split(",");
      if (parts.length > 1) {
        const country = parts[parts.length - 1].trim();
        // Map common country names to codes
        if (country.toLowerCase().includes("england") || country.toLowerCase().includes("uk")) return "UK";
        if (country.toLowerCase().includes("canada")) return "CA";
        if (country.toLowerCase().includes("india")) return "IN";
        return country.substring(0, 2).toUpperCase();
      }
    }
    return "Offline";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">Workshops</h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Workshops where the community comes together to learn, share knowledge, and build. Show up, participate, and strengthen your profile through verified attendance.
              </p>
            </div>
            {isAdmin && (
              <Button size="sm" variant="default" asChild className="text-xs sm:text-sm whitespace-nowrap">
                <Link href="/admin/workshops" className="flex items-center gap-1.5 sm:gap-2">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Submit Event</span>
                  <span className="sm:hidden">Submit</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile: Tabs | Desktop: Side-by-side */}
        <div className="lg:grid lg:grid-cols-[1fr_320px]" style={{ gap: 0 }}>
          {/* Mobile Tabs */}
          <Tabs defaultValue="discover" className="lg:hidden w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="discover" className="text-xs sm:text-sm">
                Discover
              </TabsTrigger>
              <TabsTrigger value="my-workshops" className="text-xs sm:text-sm">
                My Workshops
              </TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs sm:text-sm">
                Calendar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-4 sm:space-y-6 mt-4">
              {/* Filters and View Toggles - Same Line */}
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                {/* Location Filters */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={locationFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationFilter("all")}
                    className="text-xs sm:text-sm"
                  >
                    All
                  </Button>
                  <Button
                    variant={locationFilter === "online" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationFilter("online")}
                    className="text-xs sm:text-sm"
                  >
                    Online
                  </Button>
                  <Button
                    variant={locationFilter === "offline" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationFilter("offline")}
                    className="text-xs sm:text-sm"
                  >
                    Offline
                  </Button>
                </div>
                
                {/* Search Button */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Workshop List */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse p-4">
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </Card>
                  ))}
                </div>
              ) : Object.keys(filteredWorkshops).length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {selectedDate
                      ? "No workshops on this date"
                      : filter === "upcoming"
                      ? "No upcoming workshops scheduled"
                      : "No workshops found"}
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(filteredWorkshops).map(([dateLabel, dateWorkshops]) => {
                    const workshopDate = new Date(dateWorkshops[0].datetime);
                    const dateParts = formatDateLabel(workshopDate).split(' ');
                    const monthDay = `${dateParts[0]} ${dateParts[1]}`;
                    const weekday = dateParts[2];
                    
                    return (
                      <div key={dateLabel}>
                        {/* Date Separator with Timeline */}
                        <div className="flex items-center gap-3 mb-4" data-date={dateLabel}>
                          <div className="flex flex-col items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/60" />
                            <div className="w-px h-6 border-l border-dashed border-muted-foreground/30 mt-1" />
                          </div>
                          <h2 className="text-base sm:text-lg font-semibold">
                            <span className="text-foreground">{monthDay}</span>
                            <span className="text-muted-foreground ml-2">{weekday}</span>
                          </h2>
                        </div>

                        {/* Workshop Cards */}
                        <div className="space-y-4">
                          {dateWorkshops.map((workshop) => {
                            const endTime = getEndTime(workshop.datetime);
                            const countryCode = getCountryCode(workshop);

                            return (
                              <Link key={workshop.id} href={`/workshops/${workshop.id}`}>
                                <Card className="p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    {/* Thumbnail */}
                                    {workshop.imageUrl && (
                                      <div className="relative w-full sm:w-24 h-48 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                                        <Image
                                          src={workshop.imageUrl}
                                          alt={workshop.title}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 640px) 100vw, 96px"
                                        />
                                      </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs sm:text-sm text-primary mb-1">
                                            {formatTimeRange(workshop.datetime, endTime)} GMT+7
                                          </p>
                                          <h3 className="font-bold text-sm sm:text-base mb-2 line-clamp-2">
                                            {workshop.title}
                                          </h3>
                                        </div>
                                        <div className="px-2 py-1 bg-primary/10 rounded text-xs font-semibold text-primary flex-shrink-0 self-start">
                                          {countryCode}
                                        </div>
                                      </div>

                                      <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                          <span className="truncate">By {workshop.hostName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {workshop.locationType === "online" ? (
                                            <>
                                              <Video className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                              <span>Online</span>
                                            </>
                                          ) : (
                                            <>
                                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                              <span className="truncate">
                                                {workshop.venueName || "Offline"}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-workshops" className="space-y-4 mt-4">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">My Workshops</h1>
              
              {!user ? (
                <Card className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to see your registered workshops
                  </p>
                </Card>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={myWorkshopsTab === "attending" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMyWorkshopsTab("attending")}
                      className="flex-1 text-xs sm:text-sm"
                    >
                      Attending ({myWorkshops.attending.length})
                    </Button>
                    <Button
                      variant={myWorkshopsTab === "attended" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMyWorkshopsTab("attended")}
                      className="flex-1 text-xs sm:text-sm"
                    >
                      Attended ({myWorkshops.attended.length})
                    </Button>
                  </div>

                  {/* Workshop List */}
                  {myWorkshopsLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(myWorkshopsTab === "attending"
                        ? myWorkshops.attending
                        : myWorkshops.attended
                      ).length === 0 ? (
                        <Card className="p-8 text-center">
                          <p className="text-sm text-muted-foreground">
                            {myWorkshopsTab === "attending"
                              ? "No upcoming workshops registered"
                              : "No past workshops attended"}
                          </p>
                        </Card>
                      ) : (
                        (myWorkshopsTab === "attending"
                          ? myWorkshops.attending
                          : myWorkshops.attended
                        ).map((workshop) => {
                          const endTime = getEndTime(workshop.datetime);
                          return (
                            <Link
                              key={workshop.id}
                              href={`/workshops/${workshop.id}`}
                            >
                              <Card className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex gap-3">
                                  {workshop.imageUrl && (
                                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                      <Image
                                        src={workshop.imageUrl}
                                        alt={workshop.title}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                                      {workshop.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {format(workshop.datetime, "MMM d, h:mm a")}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {workshop.locationType === "online" ? (
                                        <>
                                          <Video className="h-3 w-3 flex-shrink-0" />
                                          <span>Online</span>
                                        </>
                                      ) : (
                                        <>
                                          <MapPin className="h-3 w-3 flex-shrink-0" />
                                          <span className="truncate">
                                            {workshop.venueName || "Offline"}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="mt-4">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">Workshop Calendar</h1>
              <WorkshopCalendar
                workshops={workshops}
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                }}
                filter={filter === "all" ? "upcoming" : filter}
                onFilterChange={(newFilter) => {
                  setFilter(newFilter);
                  setSelectedDate(null);
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Desktop: Side-by-side layout */}
          <div className="hidden lg:grid" style={{ gridTemplateColumns: '1fr 320px', gap: 0 }}>
            {/* Left Panel - Workshop List */}
            <div className="space-y-6" style={{ marginRight: 0 }}>
              {/* Filters and View Toggles - Same Line */}
              <div className="flex items-center justify-between gap-4">
                {/* Location Filters */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={locationFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={locationFilter === "online" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationFilter("online")}
                  >
                    Online
                  </Button>
                  <Button
                    variant={locationFilter === "offline" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationFilter("offline")}
                  >
                    Offline
                  </Button>
                </div>
                
                {/* Search Button */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            {/* Workshop List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse p-4">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : Object.keys(filteredWorkshops).length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  {selectedDate
                    ? "No workshops on this date"
                    : filter === "upcoming"
                    ? "No upcoming workshops scheduled"
                    : "No workshops found"}
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                  {Object.entries(filteredWorkshops).map(([dateLabel, dateWorkshops]) => {
                    const workshopDate = new Date(dateWorkshops[0].datetime);
                    const dateParts = formatDateLabel(workshopDate).split(' ');
                    const monthDay = `${dateParts[0]} ${dateParts[1]}`;
                    const weekday = dateParts[2];
                    
                    return (
                  <div key={dateLabel}>
                        {/* Date Separator with Timeline */}
                        <div className="flex items-center gap-3 mb-4" data-date={dateLabel}>
                          <div className="flex flex-col items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/60" />
                            <div className="w-px h-6 border-l border-dashed border-muted-foreground/30 mt-1" />
                          </div>
                          <h2 className="text-lg font-semibold">
                            <span className="text-foreground">{monthDay}</span>
                            <span className="text-muted-foreground ml-2">{weekday}</span>
                          </h2>
                    </div>

                    {/* Workshop Cards */}
                        <div className="space-y-4">
                      {dateWorkshops.map((workshop) => {
                        const endTime = getEndTime(workshop.datetime);
                        const countryCode = getCountryCode(workshop);

                        return (
                          <Link key={workshop.id} href={`/workshops/${workshop.id}`}>
                            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                              <div className="flex gap-4">
                                {/* Thumbnail */}
                                {workshop.imageUrl && (
                                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                      src={workshop.imageUrl}
                                      alt={workshop.title}
                                      fill
                                      className="object-cover"
                                      sizes="96px"
                                    />
                                  </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-primary mb-1">
                                        {formatTimeRange(workshop.datetime, endTime)} GMT+7
                                      </p>
                                      <h3 className="font-bold text-base mb-2 line-clamp-2">
                                        {workshop.title}
                                      </h3>
                                    </div>
                                    <div className="px-2 py-1 bg-primary/10 rounded text-xs font-semibold text-primary flex-shrink-0">
                                      {countryCode}
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      <span>By {workshop.hostName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {workshop.locationType === "online" ? (
                                        <>
                                          <Video className="h-4 w-4" />
                                          <span>Online</span>
                                        </>
                                      ) : (
                                        <>
                                          <MapPin className="h-4 w-4" />
                                              <span>{workshop.venueName || "Offline"}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                    );
                  })}
              </div>
            )}
            </div>
          </div>

          {/* Right Panel - Calendar & My Workshops */}
          <div className="hidden lg:block space-y-6" style={{ marginLeft: 0 }}>
            <WorkshopCalendar
              workshops={workshops}
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                if (date) {
                  const workshopDate = new Date(date);
                  const dateLabel = formatDateLabel(workshopDate);
                  const element = document.querySelector(`[data-date="${dateLabel}"]`);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }
              }}
              filter={filter === "all" ? "upcoming" : filter}
              onFilterChange={(newFilter) => {
                setFilter(newFilter);
                setSelectedDate(null);
              }}
            />

            {/* My Workshops - Attending/Attended */}
            <Card className="p-4">
              <h3 className="text-lg font-bold mb-4">My Workshops</h3>
              
              {!user ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to see your registered workshops
                  </p>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={myWorkshopsTab === "attending" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMyWorkshopsTab("attending")}
                      className="flex-1"
                    >
                      Attending ({myWorkshops.attending.length})
                    </Button>
                    <Button
                      variant={myWorkshopsTab === "attended" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMyWorkshopsTab("attended")}
                      className="flex-1"
                    >
                      Attended ({myWorkshops.attended.length})
                    </Button>
                  </div>

                  {/* Workshop List */}
                  {myWorkshopsLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {(myWorkshopsTab === "attending"
                        ? myWorkshops.attending
                        : myWorkshops.attended
                      ).length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            {myWorkshopsTab === "attending"
                              ? "No upcoming workshops registered"
                              : "No past workshops attended"}
                          </p>
                        </div>
                      ) : (
                        (myWorkshopsTab === "attending"
                          ? myWorkshops.attending
                          : myWorkshops.attended
                        ).map((workshop) => {
                          return (
                            <Link
                              key={workshop.id}
                              href={`/workshops/${workshop.id}`}
                            >
                              <Card className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex gap-3">
                                  {workshop.imageUrl && (
                                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                      <Image
                                        src={workshop.imageUrl}
                                        alt={workshop.title}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                                      {workshop.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {format(workshop.datetime, "MMM d, h:mm a")}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {workshop.locationType === "online" ? (
                                        <>
                                          <Video className="h-3 w-3" />
                                          <span>Online</span>
                                        </>
                                      ) : (
                                        <>
                                          <MapPin className="h-3 w-3" />
                                          <span className="truncate">
                                            {workshop.venueName || "Offline"}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
