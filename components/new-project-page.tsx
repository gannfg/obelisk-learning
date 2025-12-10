"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject } from "@/lib/projects";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { Loader2, Image as ImageIcon, X, Users, User, AlertCircle, FolderKanban } from "lucide-react";
import { uploadProjectImage } from "@/lib/storage";
import { getAllTeams, TeamWithDetails } from "@/lib/teams";
import { getUserProfile } from "@/lib/profile";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface NewProjectPageClientProps {
  initialTeamId?: string;
}

export function NewProjectPageClient({ initialTeamId }: NewProjectPageClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<"individual" | "team">(
    initialTeamId ? "team" : "individual"
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(initialTeamId);
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; avatar?: string } | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in?redirect=/academy/projects/new");
    }
  }, [user, authLoading, router]);

  // Load user profile for individual projects
  useEffect(() => {
    if (user && projectType === "individual") {
      const loadUserProfile = async () => {
        try {
          const profile = await getUserProfile(user.id, undefined, supabase);
          const fullName = [profile?.first_name, profile?.last_name]
            .filter(Boolean)
            .join(" ")
            .trim();
          const username =
            profile?.username ||
            (fullName.length > 0 ? fullName : undefined) ||
            profile?.email?.split("@")[0];

          setUserProfile({
            name: username || `User ${user.id.slice(0, 8)}`,
            avatar: profile?.image_url || undefined,
          });
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUserProfile({
            name: user.email?.split("@")[0] || `User ${user.id.slice(0, 8)}`,
            avatar: undefined,
          });
        }
      };
      loadUserProfile();
    }
  }, [user, projectType, supabase]);

  // Load teams when team project type is selected
  useEffect(() => {
    if (user && projectType === "team") {
      setLoadingTeams(true);
      getAllTeams(supabase)
        .then((teamList) => {
          // Filter teams where user is a member
          const userTeams = teamList.filter((team) =>
            team.members?.some((member) => member.userId === user.id)
          );
          setTeams(userTeams);
          
          // If initialTeamId is provided, set it as selected
          if (initialTeamId) {
            const team = userTeams.find((t) => t.id === initialTeamId);
            if (team) {
              setSelectedTeam(team);
              setSelectedTeamId(initialTeamId);
            }
          }
        })
        .catch((error) => {
          console.error("Error loading teams:", error);
        })
        .finally(() => {
          setLoadingTeams(false);
        });
    }
  }, [user, projectType, initialTeamId, supabase]);

  // Update selected team when teamId changes
  useEffect(() => {
    if (selectedTeamId && teams.length > 0) {
      const team = teams.find((t) => t.id === selectedTeamId);
      setSelectedTeam(team || null);
    }
  }, [selectedTeamId, teams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError("You must be signed in to create a project");
      return;
    }

    if (projectType === "team" && !selectedTeamId) {
      setError("Please select a team for this project");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const difficulty = formData.get("difficulty") as
      | "beginner"
      | "intermediate"
      | "advanced";
    const progressLog = formData.get("progressLog") as string;
    const tagsInput = formData.get("tags") as string;
    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    try {
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        const uploaded = await uploadProjectImage(thumbnailFile, null, supabase);
        if (!uploaded) {
          setError("Failed to upload project image. Please try again.");
          setLoading(false);
          return;
        }
        thumbnailUrl = uploaded;
      }

      const project = await createProject(
        {
          title,
          description,
          status: "planning",
          difficulty,
          tags,
          thumbnail: thumbnailUrl,
          teamId: projectType === "team" ? selectedTeamId : undefined,
          progressLog: progressLog || undefined,
        },
        user.id,
        supabase
      );

      if (project) {
        router.push(`/academy/projects/${project.id}`);
      } else {
        setError("Failed to create project. Please try again.");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      setError("An error occurred while creating the project.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                You must be signed in to create a project.
              </p>
              <Button asChild>
                <Link href="/auth/sign-in?redirect=/academy/projects/new">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <Link
          href="/academy/projects"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block transition-colors"
        >
          ← Back to Projects
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>
              Start a new Web3 project and invite team members to collaborate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Project Type</Label>
                <RadioGroup
                  value={projectType}
                  onValueChange={(value) => {
                    setProjectType(value as "individual" | "team");
                    if (value === "individual") {
                      setSelectedTeamId(undefined);
                      setSelectedTeam(null);
                    }
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                    <Label
                      htmlFor="individual"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-border bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <User className="mb-3 h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Individual</div>
                        <div className="text-xs text-muted-foreground">Personal project</div>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="team" id="team" className="peer sr-only" />
                    <Label
                      htmlFor="team"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-border bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Users className="mb-3 h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Team</div>
                        <div className="text-xs text-muted-foreground">Team project</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Team Selector (only for team projects) */}
              {projectType === "team" && (
                <div className="space-y-2">
                  <Label htmlFor="team-select" className="text-sm font-medium">
                    Select Team
                  </Label>
                  {loadingTeams ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading teams...
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="p-4 rounded-md border border-border bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-3">
                        You are not a member of any teams yet.
                      </p>
                      <Button type="button" variant="outline" size="sm" asChild>
                        <Link href="/academy/teams/new">Create a Team</Link>
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={selectedTeamId}
                      onValueChange={setSelectedTeamId}
                      required={projectType === "team"}
                    >
                      <SelectTrigger id="team-select">
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Team Details Preview (only for team projects with selected team) */}
              {projectType === "team" && selectedTeam && (
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      {selectedTeam.avatar ? (
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={selectedTeam.avatar}
                            alt={selectedTeam.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{selectedTeam.name}</h3>
                        {selectedTeam.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {selectedTeam.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{selectedTeam.memberCount || 0} members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FolderKanban className="h-4 w-4" />
                            <span>{selectedTeam.projectCount || 0} projects</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Member Details (only for individual projects) */}
              {projectType === "individual" && userProfile && (
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Member Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      {userProfile.avatar ? (
                        <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={userProfile.avatar}
                            alt={userProfile.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-semibold text-primary">
                            {userProfile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{userProfile.name}</h3>
                        <p className="text-sm text-muted-foreground">Project Owner</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Project Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., DeFi Trading Platform"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your project..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project Image</label>
                {thumbnailPreview && (
                  <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden border border-border mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailPreview}
                      alt="Project image preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailPreview(null);
                      }}
                      className="absolute top-2 right-2 rounded-full bg-background border border-border p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="thumbnail-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-muted transition-colors text-sm"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {thumbnailFile ? "Change Image" : "Upload Image"}
                  </label>
                  <input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setThumbnailFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setThumbnailPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an image to use on the project card (optional).
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="progressLog" className="text-sm font-medium">
                  Progress Log
                </label>
                <Textarea
                  id="progressLog"
                  name="progressLog"
                  placeholder="Notes, milestones, or progress updates for this project..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-sm font-medium">
                  Difficulty Level
                </Label>
                <Select name="difficulty" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="e.g., Solana, DeFi, Web3"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/academy/projects">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


