"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClassModule } from "@/lib/classes";
import { updateModule, getClassById } from "@/lib/classes";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { createClient } from "@/lib/supabase/client";
import { notifyModuleReleased } from "@/lib/classroom-notifications";

interface ModuleEditorProps {
  module: ClassModule;
  classId: string;
  onUpdate: (module: ClassModule) => void;
  onCancel: () => void;
}

export function ModuleEditor({ module, classId, onUpdate, onCancel }: ModuleEditorProps) {
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description || "");
  const [content, setContent] = useState(
    typeof module.content === "string" ? module.content : JSON.stringify(module.content || {}, null, 2)
  );
  const [releaseDate, setReleaseDate] = useState(
    module.releaseDate ? new Date(module.releaseDate).toISOString().split("T")[0] : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createLearningClient();
      if (!supabase) return;

      const updateData: any = {
        title,
        description,
      };
      
      // Parse content if it's JSON, otherwise keep as string
      try {
        const parsed = JSON.parse(content);
        updateData.content = parsed;
      } catch {
        updateData.content = content;
      }
      
      if (releaseDate) {
        updateData.releaseDate = releaseDate;
      }

      const wasReleased = module.isReleased;
      const updated = await updateModule(module.id, updateData, supabase);

      if (updated) {
        // Send notification if module was just released
        if (!wasReleased && updated.isReleased) {
          try {
            const authSupabase = createClient();
            const classItem = await getClassById(module.classId, supabase);
            if (authSupabase && classItem) {
              await notifyModuleReleased(
                module.classId,
                classItem.title,
                updated.title,
                updated.weekNumber,
                supabase,
                authSupabase
              );
            }
          } catch (notifError) {
            console.error("Error sending module release notification:", notifError);
            // Don't fail the update if notification fails
          }
        }
        
        onUpdate(updated);
      }
    } catch (error) {
      console.error("Error updating module:", error);
    } finally {
      setLoading(false);
    }
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="content">Content (Markdown)</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <Label htmlFor="releaseDate">Release Date</Label>
        <Input
          id="releaseDate"
          type="date"
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

