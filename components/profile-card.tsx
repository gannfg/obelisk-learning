"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/lib/profile";
import { User, Mail, Calendar, Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProfileCardProps {
  profile: UserProfile;
  showEditButton?: boolean;
}

export function ProfileCard({ profile, showEditButton = true }: ProfileCardProps) {
  const fullName = profile.first_name || profile.last_name
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : profile.username || 'User';

  const displayName = fullName || profile.email.split('@')[0];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-2xl">Profile</CardTitle>
          {showEditButton && (
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.image_url ? (
              <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-border">
                <Image
                  src={profile.image_url}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-medium mb-1">{displayName}</h2>
              {profile.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{profile.email}</span>
              </div>

              {profile.bio && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </div>
              )}

              {profile.created_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

