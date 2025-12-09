import { createAuthServerClient } from "./server";

export async function getCurrentUser() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
}

