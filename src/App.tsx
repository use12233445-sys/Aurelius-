import { useEffect, useState } from "react";
import {
  ArrowLeft, Menu, PanelLeftClose, PanelLeftOpen, User,
  LogOut, LogIn, Database, ShieldCheck
} from "lucide-react";
import { Sidebar, type ViewId } from "@/components/Sidebar";
import { useAppData } from "@/lib/useAppData";
import { Dashboard } from "@/views/Dashboard";
import { NotesView } from "@/views/NotesView";
import { AssignmentsView } from "@/views/AssignmentsView";
import { FocusView } from "@/views/FocusView";
import { AiView } from "@/views/AiView";
import { ShareView } from "@/views/ShareView";
import { LandingPage } from "@/views/LandingPage";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { AuthModal } from "@/components/AuthModal";

function App() {
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState<ViewId>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("guest");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const data = useAppData(userId);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session?.user) {
        setEntered(true);
        setUserId(sessionData.session.user.id);
        setUserEmail(sessionData.session.user.email ?? null);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setEntered(true);
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
      } else {
        setUserId("guest");
        setUserEmail(null);
      }
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  const handleSignOut = async () => {
    if (supabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUserId("guest");
    setUserEmail(null);
    setProfileOpen(false);
  };

  if (!entered) {
    return <LandingPage onEnter={() => setEntered(true)} />;
  }

  const goBack = () => {
    if (view !== "dashboard") {
      setView("dashboard");
    } else {
      setEntered(false);
    }
  };

  const currentUser = {
    id: userId,
    email: userEmail,
    name: userEmail ? userEmail.split("@")[0] : "Guest Student",
  };

  return (
    <div className="flex min-h-screen bg-[#07152F]">
      <Sidebar
        current={view}
        onNavigate={setView}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#1a3060]/50 bg-[#061128]/80 px-4 py-3 backdrop-blur lg:px-8">
          {/* Back button */}
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[#7891c0] transition-colors hover:bg-[#102A50]/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500/40"
            aria-label="Go back"
          >
            <ArrowLeft size={18} strokeWidth={2} />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Sidebar collapse toggle (desktop) / open menu (mobile) */}
          <button
            className="hidden rounded-md p-1.5 text-[#7891c0] transition-colors hover:bg-[#102A50]/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500/40 lg:block"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>

          <button
            className="rounded-md p-1.5 text-[#7891c0] hover:bg-[#102A50]/60 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          {/* Storage status pill */}
          <div className="hidden items-center gap-1.5 text-xs sm:flex">
            {data.notesStorageMode === "cloud" ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Database size={13} /> Cloud Synced
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#7891c0]">
                <ShieldCheck size={13} className="text-[#5cb8ff]" /> Data saved locally
              </span>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-[#1a3060]/60 bg-[#0C2042] px-3 py-1.5 transition-colors hover:border-cobalt-500/40"
              aria-label="User profile options"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cobalt-600 text-white">
                <User size={14} />
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-xs font-medium text-[#e0eaff]">{userEmail ?? "Guest Student"}</p>
                <p className="text-[10px] text-[#5a72a0]">{userEmail ? "Authenticated" : "Guest Mode"}</p>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#1a3060] bg-[#081630] p-2 shadow-2xl z-30">
                <div className="p-2 border-b border-[#1a3060]/60">
                  <p className="text-xs font-semibold text-[#e0eaff] truncate">
                    {userEmail ?? "Guest Student"}
                  </p>
                  <p className="text-[11px] text-[#5a72a0] mt-0.5">
                    {userEmail ? "Account linked" : "Local session only"}
                  </p>
                </div>

                <div className="pt-1.5 space-y-1">
                  {userEmail ? (
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setShowAuthModal(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#5cb8ff] hover:bg-cobalt-600/15 transition-colors"
                    >
                      <LogIn size={13} /> Sign In / Create Account
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {view === "dashboard" && <Dashboard data={data} onNavigate={setView} />}
          {view === "notes" && <NotesView data={data} />}
          {view === "assignments" && <AssignmentsView data={data} />}
          {view === "focus" && <FocusView data={data} />}
          {view === "ai" && <AiView />}
          {view === "share" && <ShareView currentUser={currentUser} />}
        </main>
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(email) => {
          setUserEmail(email);
        }}
      />
    </div>
  );
}

export default App;
