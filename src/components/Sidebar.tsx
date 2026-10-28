import {
  BookOpen, CheckSquare, Clock, LayoutDashboard, MessagesSquare, Share2,
  GraduationCap, X, type LucideIcon,
} from "lucide-react";

export type ViewId = "dashboard" | "notes" | "assignments" | "focus" | "ai" | "share";

const NAV: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "notes", label: "Class Notes", icon: BookOpen },
  { id: "assignments", label: "Assignments", icon: CheckSquare },
  { id: "focus", label: "Focus Mode", icon: Clock },
  { id: "ai", label: "AI Doubt Solver", icon: MessagesSquare },
  { id: "share", label: "Classmate Sharing", icon: Share2 },
];

interface SidebarProps {
  current: ViewId;
  onNavigate: (v: ViewId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
}

export function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile, collapsed }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} aria-hidden />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden border-r border-[#1a3060]/60 bg-[#061128] transition-all duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-0 lg:border-r-0 lg:opacity-0" : "lg:w-64 lg:opacity-100"}`}
        aria-label="Primary navigation"
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cobalt-600 text-white shadow-md shadow-cobalt-600/30">
              <GraduationCap size={20} />
            </div>
            <div className="leading-tight">
              <p className="heading-serif text-sm font-semibold text-white">Aurelius</p>
              <p className="text-[11px] text-[#5a72a0]">AI Learning Platform</p>
            </div>
          </div>
          <button className="rounded-md p-1 text-[#7891c0] hover:bg-[#1a3060]/50 lg:hidden" onClick={onCloseMobile} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = current === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onCloseMobile(); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-cobalt-600/20 text-[#5cb8ff] border border-cobalt-500/30"
                    : "text-[#7891c0] hover:bg-[#102A50]/60 hover:text-[#e0eaff] border border-transparent"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4">
          <div className="rounded-xl bg-gradient-to-br from-cobalt-700 to-cobalt-950 p-4 text-white shadow-md shadow-cobalt-700/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7dd3ff]">Study tip</p>
            <p className="mt-1 text-[13px] leading-snug text-[#c4dcff]">
              Use Focus Mode for 25-minute sprints, then take a 5-minute break.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
