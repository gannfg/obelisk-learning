"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Video,
  Clock,
  Users,
  List,
  Grid3x3,
  Search,
  Plus,
  Filter,
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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

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

  // Extract unique countries from workshops
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    workshops.forEach((workshop) => {
      if (workshop.venueName) {
        // Extract country from venue (e.g., "Exeter, England" -> "UK")
        // For now, we'll use a simple approach - you can enhance this
        const parts = workshop.venueName.split(",");
        if (parts.length > 1) {
          const country = parts[parts.length - 1].trim();
          countrySet.add(country);
        }
      } else if (workshop.locationType === "online") {
        countrySet.add("Online");
      }
    });
    return Array.from(countrySet).sort();
  }, [workshops]);

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

    // Filter by country
    if (countryFilter) {
      filtered = filtered.filter((workshop) => {
        if (countryFilter === "Online") {
          return workshop.locationType === "online";
        }
        if (workshop.venueName) {
          return workshop.venueName.includes(countryFilter);
        }
        return false;
      });
    }

    // Group by date
    const grouped = filtered.reduce((acc, workshop) => {
      const date = format(new Date(workshop.datetime), "MMM d EEEE");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(workshop);
      return acc;
    }, {} as Record<string, Workshop[]>);

    return grouped;
  }, [workshops, selectedDate, countryFilter]);

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

  // Get country code from venue name
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
    return "WW";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-md">
              <span className="text-sm font-semibold text-primary">Superteam Member</span>
              <span className="text-xs text-muted-foreground">Free</span>
            </div>
            {user && (
              <Button size="sm" variant="outline">
                Join
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button size="sm" variant="default" asChild>
                <Link href="/admin/workshops">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Event
                </Link>
              </Button>
            )}
            <Button size="sm" variant="ghost">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Panel - Workshop List */}
          <div className="space-y-6">
            {/* Title and View Toggles */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl sm:text-4xl font-bold">Workshops</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Country Filters */}
            {countries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={countryFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCountryFilter(null)}
                >
                  All
                </Button>
                {countries.map((country) => {
                  const count = workshops.filter((w) => {
                    if (country === "Online") return w.locationType === "online";
                    return w.venueName?.includes(country);
                  }).length;
                  return (
                    <Button
                      key={country}
                      variant={countryFilter === country ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCountryFilter(country)}
                    >
                      {country} {count}
                    </Button>
                  );
                })}
              </div>
            )}

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
                {Object.entries(filteredWorkshops).map(([dateLabel, dateWorkshops]) => (
                  <div key={dateLabel}>
                    {/* Date Separator */}
                    <div className="flex items-center gap-2 mb-4" data-date={dateLabel}>
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <h2 className="text-lg font-semibold">{dateLabel}</h2>
                    </div>

                    {/* Workshop Cards */}
                    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
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
                                          <span>
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
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Calendar */}
          <div className="space-y-6">
            <WorkshopCalendar
              workshops={workshops}
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                if (date) {
                  // Scroll to workshops for this date
                  const dateLabel = format(date, "MMM d EEEE");
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

            {/* World Map Placeholder */}
            <Card className="p-4">
              <h3 className="text-lg font-bold mb-4">Global Events</h3>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">World Map Coming Soon</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
