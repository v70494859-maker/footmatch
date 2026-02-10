"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLE_HOME_ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import Button from "./Button";
import Logo from "./Logo";

export default function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<"google" | "apple" | "email" | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(provider);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading("email");
    setMessage(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setLoading(null);
      if (error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: t.auth.checkEmail, type: "success" });
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setLoading(null);
        setMessage({ text: error.message, type: "error" });
        return;
      }
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (!profile) {
          router.push("/onboarding");
        } else {
          const role = profile.role as UserRole;
          router.push(ROLE_HOME_ROUTES[role] || "/matches");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Logo />
          <p className="text-surface-400 text-sm">
            {t.auth.trialInfo}
          </p>
        </div>

        {(error || message) && (
          <div
            className={`rounded-xl p-3 text-center border ${
              message?.type === "success"
                ? "bg-pitch-500/10 border-pitch-500/20"
                : "bg-danger-500/10 border-danger-500/20"
            }`}
          >
            <p
              className={`text-sm ${
                message?.type === "success" ? "text-pitch-400" : "text-danger-500"
              }`}
            >
              {message?.text || t.auth.authError}
            </p>
          </div>
        )}

        {/* OAuth buttons */}
        <div className="space-y-3">
          <Button
            variant="google"
            fullWidth
            loading={loading === "google"}
            disabled={loading !== null}
            onClick={() => handleOAuth("google")}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t.auth.withGoogle}
          </Button>

          <Button
            variant="apple"
            fullWidth
            loading={loading === "apple"}
            disabled={loading !== null}
            onClick={() => handleOAuth("apple")}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            {t.auth.withApple}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-surface-800" />
          <span className="text-xs text-surface-500 uppercase tracking-wider">{t.auth.or}</span>
          <div className="h-px flex-1 bg-surface-800" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            placeholder={t.auth.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl bg-surface-900 border border-surface-800 px-4 py-3 text-sm text-foreground placeholder-surface-500 outline-none transition-colors focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500"
          />
          <input
            type="password"
            placeholder={t.auth.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl bg-surface-900 border border-surface-800 px-4 py-3 text-sm text-foreground placeholder-surface-500 outline-none transition-colors focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500"
          />
          <Button
            type="submit"
            fullWidth
            loading={loading === "email"}
            disabled={loading !== null}
          >
            {mode === "login" ? t.auth.loginCta : t.auth.signupCta}
          </Button>
        </form>

        {/* Toggle login/signup */}
        <p className="text-center text-surface-500 text-sm">
          {mode === "login" ? t.auth.noAccount : t.auth.hasAccount}
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "login" ? "signup" : "login"));
              setMessage(null);
            }}
            className="text-pitch-400 hover:text-pitch-300 font-medium transition-colors"
          >
            {mode === "login" ? t.auth.signup : t.auth.login}
          </button>
        </p>

        <p className="text-center text-surface-500 text-xs">
          {t.auth.terms}
        </p>
      </div>
    </div>
  );
}
