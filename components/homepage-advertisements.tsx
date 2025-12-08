"use client";

import { useEffect, useState } from "react";
import { AdCarousel } from "@/components/ad-carousel";
import { getActiveAdvertisements, Advertisement } from "@/lib/advertisements";
import { createLearningClient } from "@/lib/supabase/learning-client";
import { Users, Sparkles, BookOpen, Target, Trophy, Calendar, LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  sparkles: Sparkles,
  book: BookOpen,
  target: Target,
  trophy: Trophy,
  calendar: Calendar,
};

interface AdSlide {
  id: string;
  title?: string;
  description?: string;
  ctaText?: string;
  href: string;
  icon?: React.ReactNode;
  bgColor?: string;
}

export function HomepageAdvertisements() {
  const [advertisements, setAdvertisements] = useState<AdSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdvertisements = async () => {
      const supabase = createLearningClient();
      const ads = await getActiveAdvertisements(supabase);
      
      // Transform advertisements to slides
      const slides: AdSlide[] = ads.map((ad) => {
        // If image URL exists, use image-based format
        if (ad.imageUrl) {
          return {
            id: ad.id,
            href: ad.href,
            imageUrl: ad.imageUrl,
          };
        }

        // Otherwise, use legacy text-based format with icons
        const IconComponent = ad.iconName ? ICON_MAP[ad.iconName] : undefined;
        const icon = IconComponent ? (
          <IconComponent className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-primary" />
        ) : undefined;

        return {
          id: ad.id,
          title: ad.title,
          description: ad.description,
          ctaText: ad.ctaText,
          href: ad.href,
          icon,
        };
      });

      setAdvertisements(slides);
      setLoading(false);
    };

    loadAdvertisements();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-border bg-muted/50 min-h-[200px] sm:min-h-[250px] md:min-h-[280px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (advertisements.length === 0) {
    return null;
  }

  return <AdCarousel slides={advertisements} autoPlayInterval={5000} />;
}

