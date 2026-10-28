import { useEffect, useState } from "react";
import { ArrowLeft, Menu, PanelLeftClose, PanelLeftOpen, User } from "lucide-react";
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

function App() {
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState<ViewId>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const data = useAppData();

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session?.user) {
        setEntered(true);
        setUserEmail(sessionData.session.user.email ?? null);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          setEntered(true);
          setUserEmail(session.user.email ?? null);
        }
      })();
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

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

          <div className="hidden items-center gap-2 text-xs text-[#5a72a0] sm:flex">
            <span className="inline-block h-2 w-2 rounded-full bg-cobalt-500" />
            Data saved locally
          </div>

          {/* Profile */}
          <div className="flex items-center gap-2 rounded-lg border border-[#1a3060]/60 bg-[#0C2042] px-3 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cobalt-600 text-white">
              <User size={14} />
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-xs font-medium text-[#e0eaff]">{userEmail ?? "Guest"}</p>
              <p className="text-[10px] text-[#5a72a0]">Student</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {view === "dashboard" && <Dashboard data={data} onNavigate={setView} />}
          {view === "notes" && <NotesView data={data} />}
          {view === "assignments" && <AssignmentsView data={data} />}
          {view === "focus" && <FocusView data={data} />}
          {view === "ai" && <AiView />}
          {view === "share" && <ShareView />}
        </main>
      </div>
    </div>
  );
}

export default App;
