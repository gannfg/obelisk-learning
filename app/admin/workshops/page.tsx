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
import { Calendar, Plus, Trash2, Edit, Users, QrCode, Download, Image as ImageIcon, X } from "lucide-react";
import type { Workshop } from "@/types/workshops";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

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
  const [selectedWorkshop, setSelectedWorkshop] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    datetime: "",
    locationType: "online" as "online" | "offline",
    venueName: "",
    meetingLink: "",
    hostName: "",
    capacity: "",
    imageUrl: "",
  });

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

      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        datetime: formData.datetime,
        locationType: formData.locationType,
        hostName: formData.hostName,
        imageUrl: imageUrl || undefined,
      };

      if (formData.locationType === "online") {
        payload.meetingLink = formData.meetingLink || undefined;
      } else {
        payload.venueName = formData.venueName || undefined;
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
          meetingLink: "",
          hostName: "",
          capacity: "",
          imageUrl: "",
        });
        setImageFile(null);
        setImagePreview(null);
        setEditingId(null);
        await loadWorkshops();
      } else {
        const data = await response.json();
        console.error("Failed to save workshop:", data);
        setError(data.error || "Failed to save workshop");
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
    setFormData({
      title: workshop.title,
      description: workshop.description || "",
      datetime: format(new Date(workshop.datetime), "yyyy-MM-dd'T'HH:mm"),
      locationType: workshop.locationType,
      venueName: workshop.venueName || "",
      meetingLink: workshop.meetingLink || "",
      hostName: workshop.hostName,
      capacity: workshop.capacity?.toString() || "",
      imageUrl: workshop.imageUrl || "",
    });
    setImagePreview(workshop.imageUrl || null);
    setImageFile(null);
  };

  const loadQRCode = async (workshopId: string) => {
    try {
      const response = await fetch(`/api/workshops/${workshopId}/qr`);
      const data = await response.json();
      setQrData(data.qrData);
      setSelectedWorkshop(workshopId);
    } catch (error) {
      console.error("Error loading QR code:", error);
      alert("Failed to load QR code");
    }
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
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
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

      {/* Create/Edit Form */}
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
                />
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Venue Name</label>
                <Input
                  value={formData.venueName}
                  onChange={(e) =>
                    setFormData({ ...formData, venueName: e.target.value })
                  }
                  placeholder="e.g., Obelisk Office, Jakarta"
                />
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
                      meetingLink: "",
                      hostName: "",
                      capacity: "",
                      imageUrl: "",
                    });
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

      {/* Workshops List */}
      <Card>
        <CardHeader>
          <CardTitle>All Workshops</CardTitle>
          <CardDescription>
            Manage existing workshops and view attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : workshops.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No workshops created yet
            </p>
          ) : (
            <div className="space-y-4">
              {workshops.map((workshop) => (
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
                        onClick={() => loadQRCode(workshop.id)}
                      >
                        <QrCode className="h-4 w-4" />
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

                  {selectedWorkshop === workshop.id && qrData && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium mb-2">QR Code for Check-in</p>
                      <div className="flex justify-center">
                        <QRCodeSVG value={qrData} size={150} />
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Share this QR code during the workshop
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

