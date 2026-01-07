"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAdmin } from "@/lib/hooks/use-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { getAllAdsAdmin, createAd, updateAd, deleteAd, Ad } from "@/lib/ads";
import { uploadCourseImage } from "@/lib/storage";
import { Loader2, Plus, Trash2, Edit2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function AdminAdvertisementsPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const learningSupabase = createLearningClient();

  // Form state
  const [href, setHref] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
      return;
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (!learningSupabase) {
      setAds([]);
      setAdsLoading(false);
      return;
    }

    loadAds();
  }, [learningSupabase]);

  const loadAds = async () => {
    if (!learningSupabase) return;

    setAdsLoading(true);
    try {
      const fetchedAds = await getAllAdsAdmin(learningSupabase);
      setAds(fetchedAds);
    } catch (error) {
      console.error("Error loading advertisements:", error);
      setError("Failed to load advertisements");
    } finally {
      setAdsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setHref("");
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setHref(ad.href);
    setImagePreview(ad.image_url);
    setImageFile(null);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!learningSupabase) {
      setError("Supabase client not configured");
      return;
    }

    if (!href) {
      setError("Link is required");
      return;
    }

    if (!imageFile && !imagePreview) {
      setError("Image is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let imageUrl = imagePreview;

      // Upload new image if provided
      if (imageFile && learningSupabase) {
        const uploadedUrl = await uploadCourseImage(imageFile, null, learningSupabase);
        if (!uploadedUrl) {
          setError("Failed to upload image");
          setSaving(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const adData = {
        title: "Advertisement", // Default title for database compatibility
        description: null,
        cta_text: "Click to view", // Default CTA for database compatibility
        href,
        image_url: imageUrl,
        order_index: 0, // Default to 0 instead of null to satisfy NOT NULL constraint
        is_active: true,
      };

      if (editingId) {
        // Update existing ad
        const updated = await updateAd(learningSupabase, editingId, adData);
        if (!updated) {
          setError("Failed to update advertisement");
          return;
        }
      } else {
        // Create new ad
        const created = await createAd(learningSupabase, adData);
        if (!created) {
          setError("Failed to create advertisement. Please check the console for details.");
          return;
        }
      }

      resetForm();
      await loadAds();
    } catch (err: any) {
      console.error("Error saving advertisement:", err);
      setError(
        err.message || "An error occurred while saving the advertisement"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!learningSupabase) {
      alert("Supabase client not configured");
      return;
    }

    if (!confirm("Are you sure you want to delete this advertisement?")) {
      return;
    }

    setDeletingId(id);
    try {
      const success = await deleteAd(learningSupabase, id);
      if (success) {
        await loadAds();
      } else {
        alert("Failed to delete advertisement");
      }
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      alert("An error occurred while deleting the advertisement");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Advertisements</h1>
        <p className="text-muted-foreground">
          Create and manage advertisements displayed on the homepage
        </p>
      </div>

      {/* Create/Edit Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            {editingId ? "Edit Advertisement" : "Create New Advertisement"}
          </CardTitle>
          <CardDescription>
            {editingId
              ? "Update the advertisement image and link"
              : "Add a new advertisement to display on the homepage"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Link (href) <span className="text-red-700 dark:text-red-500">*</span>
              </label>
              <Input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="e.g., /mentor-chat or https://example.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                The link will open in a new tab when clicked
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Advertisement Image <span className="text-red-700 dark:text-red-500">*</span>
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
                required={!imagePreview}
              />
              {imagePreview && (
                <div className="mt-4 relative w-full h-48 rounded-lg overflow-hidden border border-border">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 512px"
                    unoptimized
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update Advertisement"
                ) : (
                  "Create Advertisement"
                )}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Advertisements */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Advertisements</CardTitle>
          <CardDescription>
            Manage existing advertisements displayed on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : ads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No advertisements yet. Create one above!
            </p>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
                >
                  {ad.image_url ? (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={ad.image_url}
                        alt={ad.title || "Advertisement image"}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Link: <span className="font-medium">{ad.href}</span>
                        </p>
                        {ad.image_url ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            Image uploaded
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            No image
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ad)}
                      disabled={deletingId === ad.id}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ad.id)}
                      disabled={deletingId === ad.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      {deletingId === ad.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

