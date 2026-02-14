import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the post
  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, match_id")
    .eq("id", postId)
    .single();

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  // Only post author (operator) or admin can add media
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAuthor = post.author_id === user.id;
  const isAdmin = profile?.role === "admin";

  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  // Get current max sort_order
  const { data: existingMedia } = await supabase
    .from("post_media")
    .select("sort_order")
    .eq("post_id", postId)
    .order("sort_order", { ascending: false })
    .limit(1);

  let nextOrder = (existingMedia?.[0]?.sort_order ?? -1) + 1;

  const mediaRecords = [];

  for (const file of files) {
    const isVideo = file.type.startsWith("video/");
    const ext = isVideo ? "mp4" : "jpg";
    const path = `${post.author_id}/${postId}/${nextOrder}.${ext}`;

    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("social-media")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) continue;

    const { data: urlData } = supabase.storage
      .from("social-media")
      .getPublicUrl(path);

    mediaRecords.push({
      post_id: postId,
      media_type: isVideo ? "video" : "image",
      media_url: urlData.publicUrl,
      thumbnail_url: null,
      sort_order: nextOrder,
    });

    nextOrder++;
  }

  if (mediaRecords.length === 0) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("post_media")
    .insert(mediaRecords)
    .select("*");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ media: inserted });
}
