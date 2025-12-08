import type { SupabaseClient } from "@supabase/supabase-js";

export interface Advertisement {
  id: string;
  imageUrl?: string;
  href: string;
  // Legacy support
  title?: string;
  description?: string;
  ctaText?: string;
  iconName?: string;
  bgColor?: string;
}

/**
 * Fetch active advertisements from Supabase
 */
export async function getActiveAdvertisements(
  supabaseClient: SupabaseClient<any> | null
): Promise<Advertisement[]> {
  if (!supabaseClient) {
    return [];
  }

  try {
    const { data, error } = await supabaseClient
      .from("advertisements")
      .select("*")
      .eq("active", true)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching advertisements:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform to Advertisement format
    return data.map((ad) => ({
      id: ad.id,
      imageUrl: ad.image_url || undefined,
      href: ad.href,
      // Legacy support for old format
      title: ad.title || undefined,
      description: ad.description || undefined,
      ctaText: ad.cta_text || undefined,
      iconName: ad.icon_name || undefined,
    }));
  } catch (error) {
    console.error("Unexpected error fetching advertisements:", error);
    return [];
  }
}

