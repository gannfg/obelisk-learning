"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pin, Plus, X } from "lucide-react";
import { format } from "date-fns";
import type { ClassWithModules } from "@/lib/classes";
import { getClassAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import { notifyNewAnnouncement } from "@/lib/classroom-notifications";
import { MarkdownContent } from "@/components/markdown-content";

interface ClassroomAnnouncementsProps {
  classId: string;
  classItem: ClassWithModules;
  userId: string;
  isInstructor: boolean;
}

export function ClassroomAnnouncements({
  classId,
  classItem,
  userId,
  isInstructor,
}: ClassroomAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, [classId]);

  const loadAnnouncements = async () => {
    const supabase = createLearningClient();
    if (!supabase) return;

    try {
      const anns = await getClassAnnouncements(classId, supabase);
      // Sort: pinned first, then by date
      const sorted = anns.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setAnnouncements(sorted);
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (title: string, content: string, pinned: boolean) => {
    const supabase = createLearningClient();
    if (!supabase) return;

    try {
      const announcement = await createAnnouncement(
        {
          classId,
          title,
          content,
          pinned,
        },
        userId,
        supabase
      );

      if (announcement) {
        // Send notifications to all enrolled students
        const authSupabase = createClient();
        if (authSupabase) {
          await notifyNewAnnouncement(
            classId,
            classItem.title,
            title,
            content,
            supabase,
            authSupabase,
            announcement.moduleId
          );
        }
        
        await loadAnnouncements();
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert("Error creating announcement. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    const supabase = createLearningClient();
    if (!supabase) return;

    try {
      const success = await deleteAnnouncement(id, supabase);
      if (success) {
        await loadAnnouncements();
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("Error deleting announcement. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6">
      {isInstructor && (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No announcements yet.</p>
          </CardContent>
        </Card>
      ) : (
        announcements.map((announcement) => (
          <Card key={announcement.id} className={announcement.pinned ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.pinned && (
                      <Pin className="h-4 w-4 text-primary" />
                    )}
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(announcement.createdAt, "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                {isInstructor && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(editingId === announcement.id ? null : announcement.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingId === announcement.id ? (
                <AnnouncementForm
                  announcement={announcement}
                  onSubmit={async (title, content, pinned) => {
                    const supabase = createLearningClient();
                    if (!supabase) return;
                    await updateAnnouncement(
                      announcement.id,
                      { title, content, pinned },
                      supabase
                    );
                    await loadAnnouncements();
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownContent content={announcement.content} />
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function AnnouncementForm({
  announcement,
  onSubmit,
  onCancel,
}: {
  announcement?: any;
  onSubmit: (title: string, content: string, pinned: boolean) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(announcement?.title || "");
  const [content, setContent] = useState(announcement?.content || "");
  const [pinned, setPinned] = useState(announcement?.pinned || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title, content, pinned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="content">Content (Markdown supported)</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="pinned"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="pinned" className="cursor-pointer">
          Pin this announcement
        </Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {announcement ? "Update" : "Create"} Announcement
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

