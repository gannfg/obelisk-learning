import type { SupabaseClient } from "@supabase/supabase-js";

export interface Ad {
  id: string;
  title: string;
  description: string | null;
  cta_text: string;
  href: string;
  image_url: string | null;
  order_index: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all active advertisements from Supabase
 */
export async function getAllAds(
  supabaseClient: SupabaseClient<any>
): Promise<Ad[]> {
  if (!supabaseClient) {
    return [];
  }

  try {
    const { data, error } = await supabaseClient
      .from("advertisements")
      .select("*")
      .order("order_index", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching advertisements:", error);
      return [];
    }

    // Filter to only return ads that have both image and href, and are active (or is_active is null/true)
    const validAds = (data || []).filter(
      (ad) => ad.image_url && ad.href && (ad.is_active !== false)
    );

    return validAds;
  } catch (error) {
    console.error("Unexpected error fetching advertisements:", error);
    return [];
  }
}

/**
 * Fetch all advertisements (including inactive) - for admin
 */
export async function getAllAdsAdmin(
  supabaseClient: SupabaseClient<any>
): Promise<Ad[]> {
  if (!supabaseClient) {
    return [];
  }

  try {
    const { data, error } = await supabaseClient
      .from("advertisements")
      .select("*")
      .order("order_index", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching advertisements:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching advertisements:", error);
    return [];
  }
}

/**
 * Create a new advertisement
 */
export async function createAd(
  supabaseClient: SupabaseClient<any>,
  ad: {
    title: string;
    description: string | null;
    cta_text: string;
    href: string;
    image_url: string | null;
    order_index: number | null;
    is_active: boolean;
  }
): Promise<Ad | null> {
  if (!supabaseClient) {
    return null;
  }

  try {
    const { data, error } = await supabaseClient
      .from("advertisements")
      .insert([ad])
      .select()
      .single();

    if (error) {
      console.error("Error creating advertisement:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error creating advertisement:", error);
    return null;
  }
}

/**
 * Update an advertisement
 */
export async function updateAd(
  supabaseClient: SupabaseClient<any>,
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    cta_text?: string;
    href?: string;
    image_url?: string | null;
    order_index?: number | null;
    is_active?: boolean;
  }
): Promise<Ad | null> {
  if (!supabaseClient) {
    return null;
  }

  try {
    const { data, error } = await supabaseClient
      .from("advertisements")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating advertisement:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error updating advertisement:", error);
    return null;
  }
}

/**
 * Delete an advertisement
 */
export async function deleteAd(
  supabaseClient: SupabaseClient<any>,
  id: string
): Promise<boolean> {
  if (!supabaseClient) {
    return false;
  }

  try {
    const { error } = await supabaseClient
      .from("advertisements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting advertisement:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error deleting advertisement:", error);
    return false;
  }
}

