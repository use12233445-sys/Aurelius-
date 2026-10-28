import { useEffect, useRef, useState } from "react";
import { ArrowLeft, AlertCircle, Mail } from "lucide-react";
import { supabaseConfigured, supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/auth";
import { AuthModal } from "@/components/AuthModal";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const orbRefs = useRef<HTMLDivElement[]>([]);
  const [authError, setAuthError] = useState("");
  const [authChecking, setAuthChecking] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        orbRefs.current.forEach((el, i) => {
          if (!el) return;
          const depth = (i + 1) * 10;
          el.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
        });
        if (sceneRef.current) {
          sceneRef.current.style.transform = `translate(${x * 6}px, ${y * 6}px)`;
        }
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (supabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) onEnter();
      });
    }
  }, [onEnter]);

  const handleGoogle = async () => {
    setAuthError("");
    setAuthChecking(true);
    const res = await signInWithGoogle();
    setAuthChecking(false);
    if (!res.ok) {
      setAuthError(res.error === "not-configured" ? "not-configured" : res.error || "Could not start sign-in. Please try again.");
    }
  };

  return (
    <div className="landing-root flex min-h-screen flex-col">
      {/* Textured academic background */}
      <div className="landing-bg-texture" />
      <div className="landing-bg-overlay" />
      <div className="landing-bg-grain" />
      <div className="landing-bg-light" />

      {/* Decorative watermark letter */}
      <span className="landing-watermark hidden lg:block">A</span>

      {/* Sapphire orbs */}
      <div ref={el => { if (el) orbRefs.current[0] = el; }} className="landing-orb animate-float-slow"
        style={{ width: 420, height: 420, top: '5%', left: '3%', background: 'radial-gradient(circle at 35% 35%, rgba(18,77,255,0.55), transparent)' }} />
      <div ref={el => { if (el) orbRefs.current[1] = el; }} className="landing-orb animate-float-med"
        style={{ width: 340, height: 340, bottom: '8%', right: '6%', background: 'radial-gradient(circle at 40% 40%, rgba(39,139,255,0.45), transparent)' }} />
      <div ref={el => { if (el) orbRefs.current[2] = el; }} className="landing-orb animate-pulse-slow"
        style={{ width: 220, height: 220, top: '40%', right: '20%', background: 'radial-gradient(circle at 50% 50%, rgba(124,211,255,0.4), transparent)' }} />

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 text-sm text-[#9bc4ff] transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500/40 rounded-lg px-1 py-1"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
          Back
        </button>
        <p className="heading-display text-lg tracking-wide text-[#c4dcff]">Aurelius</p>
      </nav>

      {/* Main scene */}
      <div
        ref={sceneRef}
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center"
        style={{ transition: 'transform 0.2s ease-out' }}
      >
        <p className="animate-fade-in-down text-[11px] font-medium uppercase tracking-[0.4em] text-[#5cb8ff]" style={{ animationDelay: '0.2s' }}>
          Est. MMXXVI · A Learning Platform
        </p>

        <h1 className="animate-fade-in-up mt-6 heading-title text-7xl leading-none tracking-tight sm:text-8xl md:text-9xl" style={{ animationDelay: '0.4s' }}>
          <span className="landing-text-gradient">Aurelius</span>
        </h1>

        <h2 className="animate-fade-in-up mt-8 max-w-4xl heading-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl" style={{ animationDelay: '0.55s' }}>
          <span className="landing-text-warm">Where ambition becomes achievement.</span>
        </h2>

        <p className="animate-fade-in-up mt-8 max-w-md text-base leading-relaxed text-[#7891c0]" style={{ animationDelay: '0.7s' }}>
          Your notes, assignments, focused study sessions, and AI-powered learning — all in one luminous place.
        </p>

        <div className="animate-fade-in-up mt-10 flex flex-col items-center gap-3.5" style={{ animationDelay: '0.9s' }}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onEnter}
              className="landing-btn-glow flex items-center gap-2.5 rounded-2xl bg-cobalt-600 px-8 py-3.5 text-base font-medium text-white shadow-xl shadow-cobalt-600/30"
            >
              Explore as Guest
            </button>
            <button
              onClick={() => setShowAuthModal(true)}
              className="landing-glass flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-medium text-[#c4dcff] transition-all hover:bg-cobalt-600/20 hover:text-white border border-cobalt-500/30"
            >
              <Mail size={16} /> Sign In / Register
            </button>
          </div>

          <button
            onClick={handleGoogle}
            disabled={authChecking}
            className="landing-glass flex items-center gap-2.5 rounded-2xl px-5 py-2.5 text-xs font-medium text-[#7891c0] transition-colors hover:text-white"
          >
            <GoogleLogo />
            {authChecking ? 'Connecting…' : 'Continue with Google'}
          </button>
        </div>

        {authError === 'not-configured' && (
          <div className="animate-fade-in landing-glass mt-6 max-w-md rounded-xl px-5 py-4">
            <div className="flex items-start gap-2.5 text-left">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-400" />
              <div className="text-sm text-[#b0c4e8]">
                <p className="font-semibold text-amber-300">Google sign-in needs setup</p>
                <p className="mt-1 leading-relaxed">You can sign in or create an account using the "Sign In / Register" button above using your email and password.</p>
              </div>
            </div>
          </div>
        )}
        {authError && authError !== 'not-configured' && (
          <p className="animate-fade-in mt-4 text-sm text-rose-300/90">{authError}</p>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => onEnter()}
      />

      {/* Footer */}
      <footer className="relative z-10 px-6 pb-6 lg:px-12">
        <div className="landing-divider mb-4" />
        <div className="flex items-center justify-between text-xs text-[#5a72a0]">
          <span>Aurelius</span>
          <span className="hidden sm:inline">Crafted for students, by students</span>
          <span>MMXXVI</span>
        </div>
      </footer>
    </div>
  );
}
