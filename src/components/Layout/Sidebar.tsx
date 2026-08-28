import { useApp, roleLabel, UserRole } from "../../context/AppContext";
import {
  LayoutDashboard, Calendar, FileText, CheckSquare, ClipboardList,
  Users, Shield, Key, BookOpen, Settings, LogOut, ChevronDown,
  ChevronRight, Menu, X, Bell, CalendarDays, UserCheck, FileCheck,
  FilePlus, ListChecks, BarChart3, Stamp
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  key: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  children?: { label: string; key: string; icon: React.ReactNode; roles?: UserRole[] }[];
}

const navItems: NavItem[] = [
  { label: "Tableau de bord", key: "dashboard", icon: <LayoutDashboard size={18} /> },
  {
    label: "Congés", key: "conges", icon: <Calendar size={18} />,
    children: [
      { label: "Nouvelle demande", key: "conge-nouvelle", icon: <FilePlus size={16} /> },
      { label: "Mes demandes", key: "conge-liste", icon: <FileText size={16} /> },
      { label: "Imputation", key: "conge-imputation", icon: <ListChecks size={16} />, roles: ["admin", "drh", "sous-directeur-drh"] },
      { label: "Décisions", key: "conge-decisions", icon: <FileCheck size={16} />, roles: ["admin", "drh", "agent"] },
      { label: "Production d'actes", key: "conge-actes", icon: <Stamp size={16} />, roles: ["admin", "directeur", "sous-directeur-drh", "gestionnaire-drh", "verificateur-rh"] },
      { label: "Planning des congés", key: "planning", icon: <CalendarDays size={16} /> },
    ]
  },
  {
    label: "Permissions", key: "permissions", icon: <ClipboardList size={18} />,
    children: [
      { label: "Nouvelle demande", key: "perm-nouvelle", icon: <FilePlus size={16} /> },
      { label: "Demandes de permission", key: "perm-liste", icon: <FileText size={16} /> },
    ]
  },
  { label: "Statistiques", key: "stats", icon: <BarChart3 size={18} />, roles: ["admin", "drh"] },
  {
    label: "Agents", key: "agents-menu", icon: <UserCheck size={18} />, roles: ["admin", "drh"],
    children: [
      { label: "Liste des agents", key: "agents", icon: <Users size={16} /> },
      { label: "Utilisateurs", key: "utilisateurs", icon: <Users size={16} /> },
    ]
  },
  {
    label: "Administration", key: "admin-menu", icon: <Shield size={18} />, roles: ["admin"],
    children: [
      { label: "Rôles & Privilèges", key: "roles", icon: <Key size={16} /> },
      { label: "Journal des actions", key: "journal", icon: <BookOpen size={16} /> },
    ]
  },
  { label: "Mon compte", key: "compte", icon: <Settings size={18} /> },
];

export default function Sidebar() {
  const { currentUser, setCurrentUser, currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } = useApp();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ conges: true });

  const role = currentUser?.role ?? "agent";

  const canSee = (roles?: UserRole[]) => !roles || roles.includes(role);

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const navigate = (key: string) => {
    setCurrentPage(key);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-100 z-30 flex flex-col transition-all duration-300 shadow-sm
        ${sidebarOpen ? "w-64" : "w-0 md:w-16 overflow-hidden"}`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 min-h-[72px]">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#E8751A] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm font-[family-name:var(--font-display)]">CI</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-800 leading-tight font-[family-name:var(--font-display)]">Ministère de la</p>
              <p className="text-xs font-bold text-[#E8751A] leading-tight font-[family-name:var(--font-display)]">Fonction Publique</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => {
            if (!canSee(item.roles)) return null;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expanded[item.key];
            const isActive = currentPage === item.key ||
              (hasChildren && item.children!.some(c => c.key === currentPage));

            if (hasChildren) {
              return (
                <div key={item.key}>
                  <button
                    onClick={() => toggle(item.key)}
                    className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600
                      ${isActive ? "text-[#E8751A] bg-orange-50" : ""}`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left font-[family-name:var(--font-sans)]">{item.label}</span>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </>
                    )}
                  </button>
                  {sidebarOpen && isExpanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5 pl-3 border-l-2 border-gray-100">
                      {item.children!.map(child => {
                        if (!canSee(child.roles)) return null;
                        return (
                          <button
                            key={child.key}
                            onClick={() => navigate(child.key)}
                            className={`sidebar-link w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600
                              ${currentPage === child.key ? "active" : ""}`}
                          >
                            <span className="flex-shrink-0 opacity-70">{child.icon}</span>
                            <span className="font-[family-name:var(--font-sans)]">
                              {child.key === "conge-liste" && role !== "agent" ? "Demande de Congé" :
                                child.key === "perm-liste" && role === "agent" ? "Mes demandes" : child.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600
                  ${currentPage === item.key ? "active" : ""}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="font-[family-name:var(--font-sans)]">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        {currentUser && sidebarOpen && (
          <div className="border-t border-gray-100 p-3">
            <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {currentUser.prenom[0]}{currentUser.nom[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{currentUser.prenom} {currentUser.nom}</p>
                <p className="text-xs text-gray-500 truncate">{roleLabel(currentUser.role)}</p>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                title="Déconnexion"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
