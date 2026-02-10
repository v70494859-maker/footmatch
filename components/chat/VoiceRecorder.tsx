"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceRecorderProps {
  onRecorded: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({
  onRecorded,
  disabled,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        if (elapsed > 0 && blob.size > 0) {
          onRecorded(blob, elapsed);
        }
        setRecording(false);
        setDuration(0);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    } catch {
      // Microphone permission denied
    }
  }, [onRecorded]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const formatDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (recording) {
    return (
      <button
        type="button"
        onClick={stopRecording}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-danger-500/10 text-danger-500 text-xs font-medium animate-pulse"
      >
        <span className="w-2 h-2 rounded-full bg-danger-500" />
        {formatDur(duration)}
        <span>Tap to stop</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className="p-2 text-surface-400 hover:text-foreground transition-colors disabled:opacity-40"
      title="Record voice note"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
        />
      </svg>
    </button>
  );
}
