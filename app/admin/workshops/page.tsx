"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin } from "@/lib/hooks/use-admin";
import { useAuth } from "@/lib/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { uploadWorkshopImage } from "@/lib/storage";
import { Calendar, Plus, Trash2, Edit, Users, QrCode, Download, Image as ImageIcon, X, ExternalLink, MapPin, List, FilePlus, ClipboardCheck, BarChart3, CheckCircle2, Filter, Search } from "lucide-react";
import type { Workshop } from "@/types/workshops";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { getCheckInUrl } from "@/lib/qr-utils";
import { VenuePicker, type VenueData } from "@/components/venue-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminWorkshopsPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user, loading: authLoading } = useAuth();

  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("list");
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    datetime: "",
    locationType: "online" as "online" | "offline",
    venueName: "",
    venueAddress: "",
    venueLat: null as number | null,
    venueLng: null as number | null,
    googleMapsUrl: "",
    meetingLink: "",
    hostName: "",
    capacity: "",
    imageUrl: "",
  });

  // Venue state
  const [selectedVenue, setSelectedVenue] = useState<{
    venueName: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Validate Google Maps URL
  const isValidGoogleMapsUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    
    // Normalize URL - add https:// if missing
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    try {
      const urlObj = new URL(normalizedUrl);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check for various Google Maps URL formats
      return (
        hostname.includes("maps.google.com") ||
        hostname.includes("google.com") ||
        hostname.includes("goo.gl") ||
        hostname.includes("maps.app.goo.gl") ||
        url.includes("maps.google") ||
        url.includes("google.com/maps") ||
        url.includes("goo.gl/maps") ||
        url.includes("maps.app.goo.gl")
      );
    } catch {
      // Check if it's a relative URL or short URL format (without protocol)
      return (
        url.includes("maps.google") ||
        url.includes("google.com/maps") ||
        url.includes("goo.gl/maps") ||
        url.includes("maps.app.goo.gl") ||
        url.match(/^(maps\.app\.)?goo\.gl\/[A-Za-z0-9]+/) !== null
      );
    }
  };

  // Extract location name from Google Maps URL
  const extractLocationNameFromUrl = async (url: string): Promise<string | null> => {
    if (!url.trim()) return null;

    try {
      // Normalize URL
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      const urlObj = new URL(normalizedUrl);
      
      // Try to extract from query parameters
      // Format: ?q=Location+Name or &q=Location+Name
      const qParam = urlObj.searchParams.get("q");
      if (qParam) {
        // Decode and clean up the location name
        const decoded = decodeURIComponent(qParam);
        // Remove coordinates if present (format: "Location Name, Lat, Lng")
        const parts = decoded.split(",");
        if (parts.length > 0 && !/^-?\d+\.?\d*$/.test(parts[0].trim())) {
          return parts[0].trim();
        }
      }

      // Try to extract from pathname for place URLs
      // Format: /maps/place/Location+Name/@lat,lng
      const pathParts = urlObj.pathname.split("/");
      const placeIndex = pathParts.indexOf("place");
      if (placeIndex >= 0 && placeIndex < pathParts.length - 1) {
        const placeName = pathParts[placeIndex + 1];
        if (placeName && !placeName.startsWith("@")) {
          return decodeURIComponent(placeName.replace(/\+/g, " "));
        }
      }

      // For short URLs, we can't extract without following the redirect
      // Return null and let user provide a name
      return null;
    } catch (error) {
      console.error("Error extracting location name:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.replace("/");
      return;
    }
    if (!adminLoading && isAdmin) {
      loadWorkshops();
    }
  }, [isAdmin, adminLoading, router]);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workshops");
      if (!response.ok) {
        console.error("Failed to load workshops:", response.status, response.statusText);
        return;
      }
      const data = await response.json();
      console.log("Loaded workshops in admin:", data.workshops?.length || 0);
      setWorkshops(data.workshops || []);
    } catch (error) {
      console.error("Error loading workshops:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate: Either venue search OR Google Maps URL required for offline workshops
    if (formData.locationType === "offline") {
      if (!selectedVenue && (!formData.googleMapsUrl || !formData.googleMapsUrl.trim())) {
        setError("Please either search for a venue or provide a Google Maps URL");
        return;
      }
      if (formData.googleMapsUrl && formData.googleMapsUrl.trim() && !isValidGoogleMapsUrl(formData.googleMapsUrl)) {
        setError("Please provide a valid Google Maps URL");
        return;
      }
    }

    setCreating(true);
    setError(null);

    try {
      let imageUrl = formData.imageUrl;
      
      // Upload image if a new file is selected
      if (imageFile) {
        try {
          // Use auth client for storage uploads (user needs to be authenticated)
          const authSupabase = createClient();
          const uploaded = await uploadWorkshopImage(imageFile, editingId || null, authSupabase);
          if (!uploaded) {
            setError("Failed to upload workshop image. Please check console for details and ensure the storage bucket exists.");
            setCreating(false);
            return;
          }
          imageUrl = uploaded;
        } catch (uploadError: any) {
          console.error("Upload error:", uploadError);
          setError(`Failed to upload image: ${uploadError.message || "Unknown error"}`);
          setCreating(false);
          return;
        }
      }

      // Convert local datetime to ISO string for storage (handles timezone conversion)
      // datetime-local input provides YYYY-MM-DDTHH:mm in local time
      // We need to convert it to ISO string for database storage
      let datetimeISO = formData.datetime;
      if (formData.datetime) {
        // Create Date object from local datetime string
        // This will be interpreted in the user's local timezone
        const localDate = new Date(formData.datetime);
        // Convert to ISO string for database (stored as UTC)
        datetimeISO = localDate.toISOString();
      }

      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        datetime: datetimeISO,
        locationType: formData.locationType,
        hostName: formData.hostName,
        imageUrl: imageUrl || undefined,
      };

      if (formData.locationType === "online") {
        payload.meetingLink = formData.meetingLink || undefined;
      } else {
        // Use venue data from VenuePicker if available
        if (selectedVenue) {
          payload.venueName = selectedVenue.venueName;
          payload.venueAddress = selectedVenue.address;
          payload.venueLat = selectedVenue.lat;
          payload.venueLng = selectedVenue.lng;
        } else if (formData.googleMapsUrl) {
          // Use Google Maps URL if provided
          // Try to extract location name from URL
          const extractedName = await extractLocationNameFromUrl(formData.googleMapsUrl);
          payload.venueName = extractedName || formData.venueName || "View on Google Maps";
          payload.googleMapsUrl = formData.googleMapsUrl;
        } else if (formData.venueName) {
          // Fallback to manual entry (no map data)
          payload.venueName = formData.venueName;
        }
      }

      if (formData.capacity) {
        payload.capacity = parseInt(formData.capacity);
      }

      const response = editingId
        ? await fetch(`/api/workshops/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/workshops", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Workshop created/updated:", responseData);
        setFormData({
          title: "",
          description: "",
          datetime: "",
          locationType: "online",
          venueName: "",
          venueAddress: "",
          venueLat: null,
          venueLng: null,
          googleMapsUrl: "",
          meetingLink: "",
          hostName: "",
          capacity: "",
          imageUrl: "",
        });
        setSelectedVenue(null);
        setImageFile(null);
        setImagePreview(null);
        setEditingId(null);
        await loadWorkshops();
        // Switch to list tab after successful creation/update
        setActiveTab("list");
      } else {
        const data = await response.json();
        console.error("Failed to save workshop:", data);
        const errorMessage = data.error || "Failed to save workshop";
        const errorDetails = data.details ? ` (${data.details})` : "";
        setError(`${errorMessage}${errorDetails}`);
      }
    } catch (error) {
      console.error("Error saving workshop:", error);
      setError("Failed to save workshop");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workshop?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/workshops/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadWorkshops();
      } else {
        alert("Failed to delete workshop");
      }
    } catch (error) {
      console.error("Error deleting workshop:", error);
      alert("Failed to delete workshop");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (workshop: Workshop) => {
    setEditingId(workshop.id);
    // Switch to create tab when editing
    setActiveTab("create");
    setFormData({
      title: workshop.title,
      description: workshop.description || "",
      datetime: (() => {
        // Convert UTC datetime from database to local datetime for datetime-local input
        const workshopDate = new Date(workshop.datetime);
        const year = workshopDate.getFullYear();
        const month = String(workshopDate.getMonth() + 1).padStart(2, '0');
        const day = String(workshopDate.getDate()).padStart(2, '0');
        const hours = String(workshopDate.getHours()).padStart(2, '0');
        const minutes = String(workshopDate.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      })(),
      locationType: workshop.locationType,
      venueName: workshop.venueName || "",
      venueAddress: (workshop as any).venueAddress || "",
      venueLat: (workshop as any).venueLat || null,
      venueLng: (workshop as any).venueLng || null,
      googleMapsUrl: (workshop as any).googleMapsUrl || "",
      meetingLink: workshop.meetingLink || "",
      hostName: workshop.hostName,
      capacity: workshop.capacity?.toString() || "",
      imageUrl: workshop.imageUrl || "",
    });
    
    // Set venue if it has coordinates
    if ((workshop as any).venueLat && (workshop as any).venueLng) {
      setSelectedVenue({
        venueName: workshop.venueName || "",
        address: (workshop as any).venueAddress || workshop.venueName || "",
        lat: (workshop as any).venueLat,
        lng: (workshop as any).venueLng,
      });
    } else {
      setSelectedVenue(null);
    }
    
    setImagePreview(workshop.imageUrl || null);
    setImageFile(null);
  };


  const exportAttendance = async (workshopId: string) => {
    try {
      const response = await fetch(`/api/workshops/${workshopId}/attendance`);
      const data = await response.json();

      // Convert to CSV
      const headers = ["Name", "Email", "Check-in Time", "Method"];
      const rows = data.attendance.map((att: any) => [
        att.user?.name || "Unknown",
        att.user?.email || "Unknown",
        format(new Date(att.checkinTime), "yyyy-MM-dd HH:mm:ss"),
        att.method,
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workshop-attendance-${workshopId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting attendance:", error);
      alert("Failed to export attendance");
    }
  };

  if (adminLoading || authLoading) {
    return <div className="container mx-auto px-3 py-4">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
            <Calendar className="h-7 w-7" />
            <span>Workshop Management</span>
          </h1>
          <p className="text-muted-foreground">
            Create and manage workshops for Superteam Study
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            All Workshops
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <FilePlus className="h-4 w-4" />
            {editingId ? "Edit" : "Create"}
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Management
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Attendance
          </TabsTrigger>
        </TabsList>

        {/* All Workshops Tab */}
        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Workshops</CardTitle>
              <CardDescription>
                Manage existing workshops and view attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workshops by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Filter Controls */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Location Filter */}
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Clear Filters */}
                  {(statusFilter !== "all" || locationFilter !== "all" || searchQuery) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("all");
                        setLocationFilter("all");
                        setSearchQuery("");
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (() => {
                // Filter workshops
                const now = new Date();
                const filteredWorkshops = workshops.filter((workshop) => {
                  // Search filter
                  if (searchQuery && !workshop.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                    return false;
                  }
                  
                  // Location filter
                  if (locationFilter !== "all" && workshop.locationType !== locationFilter) {
                    return false;
                  }
                  
                  // Status filter
                  if (statusFilter !== "all") {
                    const workshopDate = new Date(workshop.datetime);
                    const qrExpired = workshop.qrExpiresAt && new Date(workshop.qrExpiresAt) < now;
                    
                    switch (statusFilter) {
                      case "active":
                        // Active: QR not expired and workshop is upcoming or recent (within last 24 hours)
                        if (qrExpired) return false;
                        const hoursSinceWorkshop = (now.getTime() - workshopDate.getTime()) / (1000 * 60 * 60);
                        return workshopDate > now || (workshopDate <= now && hoursSinceWorkshop <= 24);
                      case "expired":
                        // Expired: QR code has expired
                        return qrExpired || false;
                      case "upcoming":
                        // Upcoming: Workshop date is in the future
                        return workshopDate > now;
                      case "past":
                        // Past: Workshop date is in the past
                        return workshopDate < now;
                      default:
                        return true;
                    }
                  }
                  
                  return true;
                });
                
                return filteredWorkshops.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {workshops.length === 0 
                      ? "No workshops created yet"
                      : "No workshops match the selected filters"}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredWorkshops.map((workshop) => (
                    <div
                      key={workshop.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      {workshop.imageUrl && (
                        <div className="relative w-full h-48">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={workshop.imageUrl}
                            alt={workshop.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{workshop.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(workshop.datetime), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {workshop.locationType === "online" ? "Online" : workshop.venueName || "Offline"} • Host: {workshop.hostName}
                            </p>
                          </div>
                          <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(workshop)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/admin/workshops/${workshop.id}/qr`}>
                              <QrCode className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/admin/workshops/${workshop.id}/attendance`}>
                              <Users className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportAttendance(workshop.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(workshop.id)}
                            disabled={deletingId === workshop.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          </div>
                        </div>
                      </div>

                    </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create/Edit Workshop Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit Workshop" : "Create New Workshop"}</CardTitle>
              <CardDescription>
                {editingId
                  ? "Update workshop details"
                  : "Add a new workshop to the calendar"}
              </CardDescription>
            </CardHeader>
            <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Host Name *</label>
                <Input
                  value={formData.hostName}
                  onChange={(e) =>
                    setFormData({ ...formData, hostName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Workshop Image</label>
              {imagePreview && (
                <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden border border-border mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Workshop image preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                      setFormData({ ...formData, imageUrl: "" });
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div>
                <label
                  htmlFor="workshop-image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-muted/50"
                >
                  <ImageIcon className="h-4 w-4" />
                  {imageFile ? "Change Image" : "Upload Image"}
                </label>
                <input
                  id="workshop-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload an image for the workshop (optional).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date & Time *</label>
                <Input
                  type="datetime-local"
                  value={formData.datetime}
                  onChange={(e) =>
                    setFormData({ ...formData, datetime: e.target.value })
                  }
                  required
                  step="60"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground">
                  Select the date and time for the workshop (in your local timezone)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location Type *</label>
                <Select
                  value={formData.locationType}
                  onValueChange={(value: "online" | "offline") =>
                    setFormData({ ...formData, locationType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.locationType === "online" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Meeting Link</label>
                <Input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingLink: e.target.value })
                  }
                  placeholder="https://meet.google.com/..."
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Venue Search</label>
                  <VenuePicker
                    value={selectedVenue}
                    onChange={(venue) => {
                      setSelectedVenue(venue);
                      // Clear Google Maps URL when venue is selected
                      if (venue) {
                        setFormData({
                          ...formData,
                          venueName: venue.venueName,
                          venueAddress: venue.address,
                          venueLat: venue.lat,
                          venueLng: venue.lng,
                          googleMapsUrl: "", // Clear Google Maps URL
                        });
                      } else {
                        setFormData({
                          ...formData,
                          venueName: "",
                          venueAddress: "",
                          venueLat: null,
                          venueLng: null,
                        });
                      }
                    }}
                    placeholder="Search for a venue (e.g., Obelisk Office, Jakarta)"
                  />
                </div>

                {/* Google Maps URL Fallback */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Google Maps Location URL (optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.googleMapsUrl}
                    onChange={async (e) => {
                      const url = e.target.value;
                      setFormData({ ...formData, googleMapsUrl: url });
                      // Clear venue selection when Google Maps URL is entered
                      if (url.trim()) {
                        setSelectedVenue(null);
                        // Try to extract location name from URL
                        if (isValidGoogleMapsUrl(url)) {
                          const extractedName = await extractLocationNameFromUrl(url);
                          setFormData((prev) => ({
                            ...prev,
                            googleMapsUrl: url,
                            venueName: extractedName || prev.venueName || "",
                            venueAddress: "",
                            venueLat: null,
                            venueLng: null,
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            googleMapsUrl: url,
                            venueName: "",
                            venueAddress: "",
                            venueLat: null,
                            venueLng: null,
                          }));
                        }
                      }
                    }}
                    placeholder="maps.google.com/... or maps.app.goo.gl/..."
                    className={formData.googleMapsUrl && !isValidGoogleMapsUrl(formData.googleMapsUrl) ? "border-red-500" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use this if you can&apos;t find the venue above. Accepts URLs from maps.google.com, google.com/maps, goo.gl/maps, or maps.app.goo.gl. Location name will be extracted automatically if available.
                  </p>
                  
                  {/* Manual venue name input when Google Maps URL is provided */}
                  {formData.googleMapsUrl && isValidGoogleMapsUrl(formData.googleMapsUrl) && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Venue Name (optional - will try to extract from URL)
                      </label>
                      <Input
                        type="text"
                        value={formData.venueName}
                        onChange={(e) =>
                          setFormData({ ...formData, venueName: e.target.value })
                        }
                        placeholder="Venue name will be extracted from URL if available"
                      />
                    </div>
                  )}
                  
                  {/* Google Maps URL Preview Card */}
                  {formData.googleMapsUrl && formData.googleMapsUrl.trim() && isValidGoogleMapsUrl(formData.googleMapsUrl) && (
                    <Card className="p-4 bg-muted/30 border-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1">
                              {formData.venueName || "Google Maps Location"}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate mb-2">
                              {formData.googleMapsUrl}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              asChild
                              className="text-xs"
                            >
                              <a
                                href={
                                  formData.googleMapsUrl.startsWith("http://") ||
                                  formData.googleMapsUrl.startsWith("https://")
                                    ? formData.googleMapsUrl
                                    : `https://${formData.googleMapsUrl}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open in Google Maps
                              </a>
                            </Button>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData({ ...formData, googleMapsUrl: "" });
                          }}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Capacity (optional)</label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={creating}>
                {creating
                  ? "Saving..."
                  : editingId
                  ? "Update Workshop"
                  : "Create Workshop"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      title: "",
                      description: "",
                      datetime: "",
                      locationType: "online",
                      venueName: "",
                      venueAddress: "",
                      venueLat: null,
                      venueLng: null,
                      googleMapsUrl: "",
                      meetingLink: "",
                      hostName: "",
                      capacity: "",
                      imageUrl: "",
                    });
                    setSelectedVenue(null);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
            </form>
          </CardContent>
        </Card>
        </TabsContent>

        {/* QR Management Tab */}
        <TabsContent value="qr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Management</CardTitle>
              <CardDescription>
                View and manage QR codes for all workshops
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : workshops.filter(w => w.qrToken).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No workshops with QR codes available
                </p>
              ) : (
                <div className="space-y-6">
                  {workshops.map((workshop) => {
                    if (!workshop.qrToken) return null;
                    const checkInUrl = getCheckInUrl(workshop.qrToken);
                    const isExpired = workshop.qrExpiresAt && new Date(workshop.qrExpiresAt) < new Date();

                    return (
                      <div key={workshop.id} className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{workshop.title}</h3>
                              {isExpired && (
                                <span className="px-2 py-1 bg-red-500/10 text-red-600 text-xs font-medium rounded">
                                  Expired
                                </span>
                              )}
                              {!isExpired && (
                                <span className="px-2 py-1 bg-green-500/10 text-green-600 text-xs font-medium rounded">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(workshop.datetime), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {workshop.qrExpiresAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Expires: {format(new Date(workshop.qrExpiresAt), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/admin/workshops/${workshop.id}/attendance`}>
                              <Users className="h-4 w-4 mr-2" />
                              View Attendance
                            </Link>
                          </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                          <div className="flex-shrink-0 bg-white p-4 rounded-lg border-2">
                            <QRCodeSVG value={checkInUrl} size={200} />
                          </div>
                          <div className="flex-1 space-y-3 min-w-0">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Check-in URL:</p>
                              <div className="flex gap-2">
                                <Input
                                  readOnly
                                  value={checkInUrl}
                                  className="flex-1 font-mono text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(checkInUrl);
                                    alert("URL copied to clipboard!");
                                  }}
                                >
                                  <ClipboardCheck className="h-4 w-4 mr-2" />
                                  Copy
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={`/admin/workshops/${workshop.id}/qr`}>
                                  <QrCode className="h-4 w-4 mr-2" />
                                  View QR Page
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a
                                  href={checkInUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open Check-in Page
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Management Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Management</CardTitle>
              <CardDescription>
                View and manage attendance across all workshops
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingAttendance ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setLoadingAttendance(true);
                        try {
                          // Load attendance for all workshops
                          const attendancePromises = workshops.map(async (workshop) => {
                            try {
                              const response = await fetch(`/api/workshops/${workshop.id}/attendance`);
                              if (!response.ok) return { workshop, attendance: [] };
                              const data = await response.json();
                              return { workshop, attendance: data.attendance || [] };
                            } catch (error) {
                              console.error(`Error loading attendance for ${workshop.id}:`, error);
                              return { workshop, attendance: [] };
                            }
                          });

                          const results = await Promise.all(attendancePromises);
                          setAllAttendance(results);
                        } catch (error) {
                          console.error("Error loading attendance:", error);
                        } finally {
                          setLoadingAttendance(false);
                        }
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Load All Attendance
                    </Button>

                    {allAttendance.length > 0 && (
                      <div className="space-y-6">
                        {allAttendance.map(({ workshop, attendance }) => (
                          <div key={workshop.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{workshop.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(workshop.datetime), "MMM d, yyyy")} • {attendance.length} attendees
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/admin/workshops/${workshop.id}/attendance`}>
                                    <Users className="h-4 w-4 mr-2" />
                                    Manage
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => exportAttendance(workshop.id)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Export
                                </Button>
                              </div>
                            </div>

                            {attendance.length > 0 ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {attendance.slice(0, 6).map((record: any) => (
                                    <div
                                      key={record.id}
                                      className="border rounded-lg p-3 flex items-center gap-3"
                                    >
                                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                          {record.user?.name || record.user?.email || "Unknown User"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(record.checkinTime), "MMM d, h:mm a")}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          {record.method === "qr" ? (
                                            <>
                                              <QrCode className="h-3 w-3" />
                                              QR Code
                                            </>
                                          ) : (
                                            "Manual"
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {attendance.length > 6 && (
                                  <p className="text-sm text-muted-foreground text-center pt-2">
                                    + {attendance.length - 6} more attendees
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No attendance recorded yet
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {allAttendance.length === 0 && !loadingAttendance && (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Click "Load All Attendance" to view attendance across all workshops
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

