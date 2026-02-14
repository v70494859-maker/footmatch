"use client";

import { useState, useRef } from "react";
import type { PostWithDetails, PostVisibility, PostMediaType } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

interface PostCreationFormProps {
  userId: string;
  onPostCreated: (post: PostWithDetails) => void;
}

interface MediaPreview {
  file: File;
  url: string;
  type: PostMediaType;
}

const MAX_MEDIA = 6;
const MAX_IMAGE_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = Math.round((height / width) * MAX_IMAGE_DIMENSION);
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_IMAGE_DIMENSION);
          height = MAX_IMAGE_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function PostCreationForm({ userId, onPostCreated }: PostCreationFormProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_MEDIA - mediaPreviews.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews: MediaPreview[] = toAdd
      .filter((file) => {
        if (file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE) return false;
        return true;
      })
      .map((file) => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" as PostMediaType : "image" as PostMediaType,
      }));

    setMediaPreviews((prev) => [...prev, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaPreviews((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!caption.trim() && mediaPreviews.length === 0) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();

    try {
      // 1. Create the post record
      const { data: newPost, error: postError } = await supabase
        .from("posts")
        .insert({
          author_id: userId,
          caption: caption.trim() || null,
          visibility,
          like_count: 0,
          comment_count: 0,
        })
        .select("*")
        .single();

      if (postError || !newPost) throw postError;

      // 2. Upload media and create post_media records
      const mediaRecords = [];
      for (let i = 0; i < mediaPreviews.length; i++) {
        const preview = mediaPreviews[i];
        const ext = preview.type === "video" ? "mp4" : "jpg";
        const path = `${userId}/${newPost.id}/${i}.${ext}`;

        let uploadData: Blob;
        if (preview.type === "image") {
          uploadData = await compressImage(preview.file);
        } else {
          uploadData = preview.file;
        }

        const { error: uploadError } = await supabase.storage
          .from("social-media")
          .upload(path, uploadData, {
            contentType: preview.type === "video" ? preview.file.type : "image/jpeg",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("social-media")
          .getPublicUrl(path);

        mediaRecords.push({
          post_id: newPost.id,
          media_type: preview.type,
          media_url: urlData.publicUrl,
          thumbnail_url: null,
          sort_order: i,
        });
      }

      let insertedMedia: typeof mediaRecords = [];
      if (mediaRecords.length > 0) {
        const { data: mediaData, error: mediaError } = await supabase
          .from("post_media")
          .insert(mediaRecords)
          .select("*");

        if (mediaError) throw mediaError;
        insertedMedia = mediaData ?? [];
      }

      // 3. Fetch the author profile for the enriched post
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, city")
        .eq("id", userId)
        .single();

      const enrichedPost: PostWithDetails = {
        ...newPost,
        author: authorProfile!,
        post_media: insertedMedia,
        user_has_liked: false,
      };

      onPostCreated(enrichedPost);

      // Reset form
      setCaption("");
      setVisibility("public");
      mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
      setMediaPreviews([]);
      setExpanded(false);
    } catch {
      setError(t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-surface-900 border border-surface-800 rounded-2xl px-4 py-3.5 text-left text-sm text-surface-500 hover:border-surface-700 transition-colors"
      >
        {t.social.feed.caption}
      </button>
    );
  }

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4">
      {/* Caption textarea */}
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={t.social.feed.caption}
        rows={3}
        autoFocus
        className="w-full bg-transparent text-sm text-surface-100 placeholder:text-surface-500 resize-none focus:outline-none leading-relaxed"
      />

      {/* Media previews */}
      {mediaPreviews.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {mediaPreviews.map((preview, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-surface-800">
              {preview.type === "image" ? (
                <img src={preview.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <video src={preview.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
              <button
                onClick={() => removeMedia(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-surface-800 mt-3 pt-3" />

      {/* Bottom controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Add media button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={mediaPreviews.length >= MAX_MEDIA}
            className="flex items-center gap-1.5 text-xs text-pitch-400 hover:text-pitch-300 disabled:text-surface-600 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
            <span>{t.social.feed.addMedia}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaSelect}
            className="hidden"
          />

          {/* Media limit hint */}
          {mediaPreviews.length > 0 && (
            <span className="text-[10px] text-surface-600">
              {mediaPreviews.length}/{MAX_MEDIA}
            </span>
          )}

          {/* Visibility selector */}
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PostVisibility)}
            className="text-xs bg-surface-800 text-surface-300 border border-surface-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-pitch-500"
          >
            <option value="public">{t.social.feed.public}</option>
            <option value="friends">{t.social.feed.friendsOnly}</option>
            <option value="team">{t.social.feed.teamOnly}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setExpanded(false);
              setCaption("");
              mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
              setMediaPreviews([]);
            }}
            className="text-xs text-surface-500 hover:text-surface-300 transition-colors px-3 py-2"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (!caption.trim() && mediaPreviews.length === 0)}
            className="bg-pitch-500 hover:bg-pitch-600 disabled:bg-surface-700 disabled:text-surface-500 text-surface-950 text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              t.social.feed.createPost
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5 mt-2">{error}</p>
      )}

      {/* Hints */}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-[10px] text-surface-600">{t.social.feed.maxMedia}</span>
        <span className="text-[10px] text-surface-600">{t.social.feed.maxVideo}</span>
      </div>
    </div>
  );
}
