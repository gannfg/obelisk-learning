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
import { uploadAdvertisementImage } from "@/lib/storage";
import { Loader2, Edit, Trash2, ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";

interface Advertisement {
  id: string;
  image_url: string | null;
  href: string;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminAdvertisementsPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadAdvertisements();
    }
  }, [isAdmin]);

  const loadAdvertisements = async () => {
    const supabase = createLearningClient();
    if (!supabase) {
      setLoadingAds(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error loading advertisements:", error);
        setError("Failed to load advertisements.");
        setLoadingAds(false);
        return;
      }

      setAdvertisements(data || []);
    } catch (err) {
      console.error("Unexpected error loading advertisements:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoadingAds(false);
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const href = formData.get("href") as string;
    const active = formData.get("active") === "on";

    const supabase = createLearningClient();
    if (!supabase) {
      setError("Supabase client not configured.");
      setSaving(false);
      return;
    }

    try {
      // Upload image if provided
      let imageUrl = selectedAd?.image_url || "";
      if (imageFile) {
        const uploadedUrl = await uploadAdvertisementImage(
          imageFile,
          selectedAd?.id || null,
          supabase
        );
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setError("Failed to upload image. Please try again.");
          setSaving(false);
          return;
        }
      }

      if (!imageUrl && !selectedAd) {
        setError("Please upload an image.");
        setSaving(false);
        return;
      }

      if (selectedAd) {
        // Update existing
        const { error: updateError } = await supabase
          .from("advertisements")
          .update({
            image_url: imageUrl || selectedAd.image_url,
            href,
            active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedAd.id);

        if (updateError) {
          console.error("Error updating advertisement:", updateError);
          setError(updateError.message || "Failed to update advertisement.");
          setSaving(false);
          return;
        }

        setSuccess("Advertisement updated successfully!");
      } else {
        // Create new
        const maxOrder = advertisements.length > 0
          ? Math.max(...advertisements.map((ad) => ad.order_index))
          : -1;

        const { error: insertError } = await supabase
          .from("advertisements")
          .insert({
            image_url: imageUrl,
            href,
            title: null, // Old column, no longer used
            description: null, // Old column, no longer used
            cta_text: null, // Old column, no longer used
            order_index: maxOrder + 1,
            active,
          });

        if (insertError) {
          console.error("Error creating advertisement:", insertError);
          setError(insertError.message || "Failed to create advertisement.");
          setSaving(false);
          return;
        }

        setSuccess("Advertisement created successfully!");
        form.reset();
        setImagePreview(null);
        setImageFile(null);
      }

      setSelectedAd(null);
      setEditingId(null);
      loadAdvertisements();
    } catch (err: any) {
      console.error("Unexpected error saving advertisement:", err);
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) {
      return;
    }

    const supabase = createLearningClient();
    if (!supabase) {
      setError("Supabase client not configured.");
      return;
    }

    try {
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting advertisement:", error);
        setError("Failed to delete advertisement.");
        return;
      }

      setSuccess("Advertisement deleted successfully!");
      if (selectedAd?.id === id) {
        setSelectedAd(null);
        setEditingId(null);
        setImagePreview(null);
        setImageFile(null);
      }
      loadAdvertisements();
    } catch (err) {
      console.error("Unexpected error deleting advertisement:", err);
      setError("An unexpected error occurred.");
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setSelectedAd(ad);
    setEditingId(ad.id);
    setImagePreview(ad.image_url || null);
    setImageFile(null);
  };

  const handleNew = () => {
    setSelectedAd(null);
    setEditingId(null);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const ad = advertisements.find((a) => a.id === id);
    if (!ad) return;

    const currentIndex = ad.order_index;
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const swapAd = advertisements.find((a) => a.order_index === newIndex);

    if (!swapAd) return;

    const supabase = createLearningClient();
    if (!supabase) return;

    try {
      // Swap order indices
      await supabase
        .from("advertisements")
        .update({ order_index: newIndex })
        .eq("id", id);

      await supabase
        .from("advertisements")
        .update({ order_index: currentIndex })
        .eq("id", swapAd.id);

      loadAdvertisements();
    } catch (err) {
      console.error("Error reordering:", err);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center min-height-[300px]">
          <p className="text-base text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Advertisements Admin</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Manage homepage advertisement carousel. Upload images and add links to external platforms.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedAd ? "Edit Advertisement" : "Create New Advertisement"}
            </CardTitle>
            <CardDescription>
              {selectedAd
                ? "Update advertisement image and link."
                : "Upload an image and add a link to an external platform."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="image" className="text-sm font-medium">
                  Advertisement Image
                </label>
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <label
                      htmlFor="image"
                      className="absolute inset-0 cursor-pointer flex items-center justify-center bg-background/0 hover:bg-background/10 transition-colors"
                    >
                      <span className="text-xs text-muted-foreground opacity-0 hover:opacity-100">
                        Click to change image
                      </span>
                      <input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <label
                      htmlFor="image"
                      className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                    >
                      Click to upload image
                    </label>
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      required={!selectedAd}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="href" className="text-sm font-medium">
                  Link URL
                </label>
                <Input
                  id="href"
                  name="href"
                  type="url"
                  placeholder="https://example.com or /internal-page"
                  defaultValue={selectedAd?.href || ""}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter a full URL (https://...) or internal path (/page)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  defaultChecked={selectedAd?.active ?? true}
                  className="rounded border-gray-300"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Active (show on homepage)
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {selectedAd ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    selectedAd ? "Update Advertisement" : "Create Advertisement"
                  )}
                </Button>
                {selectedAd && (
                  <Button type="button" variant="outline" onClick={handleNew}>
                    New Advertisement
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List Section */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Advertisements</CardTitle>
            <CardDescription>
              {loadingAds
                ? "Loading..."
                : `${advertisements.length} advertisement${advertisements.length !== 1 ? "s" : ""} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAds ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : advertisements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No advertisements found. Create your first advertisement above.
              </p>
            ) : (
              <div className="space-y-3">
                {advertisements.map((ad) => (
                  <div
                    key={ad.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${
                      editingId === ad.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background/50"
                    }`}
                  >
                    {ad.image_url ? (
                      <div className="relative w-24 h-16 flex-shrink-0 rounded-md overflow-hidden">
                        <Image
                          src={ad.image_url}
                          alt="Advertisement"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-16 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">
                        {ad.href}
                      </p>
                      {!ad.active && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground mt-1 inline-block">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReorder(ad.id, "up")}
                        disabled={ad.order_index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReorder(ad.id, "down")}
                        disabled={ad.order_index === advertisements.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ad)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
