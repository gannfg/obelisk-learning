import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("project_comments")
    .select(
      `
        *,
        author:users(id, first_name, last_name, username, image_url)
      `
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped =
    data?.map((c) => ({
      id: c.id,
      project_id: c.project_id,
      user_id: c.user_id,
      body: c.body,
      created_at: c.created_at,
      updated_at: c.updated_at,
      author: c.author
        ? {
            id: c.author.id,
            name:
              [c.author.first_name, c.author.last_name].filter(Boolean).join(" ").trim() ||
              c.author.username ||
              "User",
            avatar: c.author.image_url,
          }
        : undefined,
    })) || [];

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, body } = await req.json();
  if (!projectId || !body || !body.trim()) {
    return NextResponse.json({ error: "projectId and body are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("project_comments")
    .insert({
      project_id: projectId,
      user_id: user.id,
      body: body.trim(),
    })
    .select(
      `
        *,
        author:users(id, first_name, last_name, username, image_url)
      `
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Insert failed" }, { status: 500 });
  }

  const mapped = {
    id: data.id,
    project_id: data.project_id,
    user_id: data.user_id,
    body: data.body,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author: data.author
      ? {
          id: data.author.id,
          name:
            [data.author.first_name, data.author.last_name].filter(Boolean).join(" ").trim() ||
            data.author.username ||
            "User",
          avatar: data.author.image_url,
        }
      : undefined,
  };

  return NextResponse.json(mapped);
}
