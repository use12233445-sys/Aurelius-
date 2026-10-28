import { useState } from "react";
import { Modal } from "./Modal";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { GraduationCap, Mail, Lock, AlertCircle, Check } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!supabaseConfigured || !supabase) {
      setError("Database / Authentication service is currently not connected.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid student email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          onSuccess(data.user.email ?? email.trim());
          onClose();
        }
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          onSuccess(data.user?.email ?? email.trim());
          onClose();
        } else {
          setSuccessMsg(
            "Account created successfully! You can now sign in with your credentials."
          );
          setMode("signin");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "signin" ? "Student Sign In" : "Create Student Account"}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-cobalt-500/30 bg-cobalt-950/40 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cobalt-600 text-white shadow-md shadow-cobalt-600/30">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#e0eaff]">Aurelius Academic Vault</p>
            <p className="text-[11px] text-[#7891c0]">
              Multi-user authentication with isolated notes & realtime classmates chat.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-[#1a3060] bg-[#081630] p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
            }}
            className={`flex-1 rounded py-1.5 font-medium transition-colors ${
              mode === "signin" ? "bg-cobalt-600 text-white" : "text-[#7891c0] hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`flex-1 rounded py-1.5 font-medium transition-colors ${
              mode === "signup" ? "bg-cobalt-600 text-white" : "text-[#7891c0] hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <Check size={15} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label" htmlFor="auth-email">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5a72a0]"
              />
              <input
                id="auth-email"
                type="email"
                required
                className="input pl-9"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="auth-pwd">
              Password
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5a72a0]"
              />
              <input
                id="auth-pwd"
                type="password"
                required
                className="input pl-9"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {mode === "signup" && (
              <p className="mt-1 text-[11px] text-[#5a72a0]">
                Password must be at least 6 characters.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost text-xs" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs gap-1.5"
            >
              {loading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing…
                </>
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
