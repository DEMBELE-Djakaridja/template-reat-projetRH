import { useApp, roleLabel } from "../../context/AppContext";
import { Menu, Bell, Search, ChevronDown, Settings, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const pageTitles: Record<string, { title: string; breadcrumb: string[] }> = {
  dashboard: { title: "Tableau de bord", breadcrumb: ["Accueil"] },
  "conge-nouvelle": { title: "Nouvelle demande de congé", breadcrumb: ["Congés", "Nouvelle demande"] },
  "conge-liste": { title: "Mes demandes de congé", breadcrumb: ["Congés", "Mes demandes"] },
  "conge-validation": { title: "Validation des congés", breadcrumb: ["Congés", "Validation"] },
  "conge-decisions": { title: "Décisions de congé", breadcrumb: ["Congés", "Décisions"] },
  "perm-nouvelle": { title: "Nouvelle demande de permission", breadcrumb: ["Permissions", "Nouvelle demande"] },
  "perm-liste": { title: "Demandes de permission", breadcrumb: ["Permissions", "Demandes de permission"] },
  "perm-validation": { title: "Demandes de permission", breadcrumb: ["Permissions", "Demandes de permission"] },
  planning: { title: "Planning des congés", breadcrumb: ["Congés", "Planning"] },
  stats: { title: "Statistiques & Rapports", breadcrumb: ["Statistiques"] },
  agents: { title: "Gestion des agents", breadcrumb: ["Agents", "Liste"] },
  utilisateurs: { title: "Gestion des utilisateurs", breadcrumb: ["Agents", "Utilisateurs"] },
  roles: { title: "Rôles & Privilèges", breadcrumb: ["Administration", "Rôles"] },
  journal: { title: "Journal des actions", breadcrumb: ["Administration", "Journal"] },
  compte: { title: "Mon compte", breadcrumb: ["Compte"] },
};

export default function Header() {
  const { currentUser, setCurrentUser, currentPage, sidebarOpen, setSidebarOpen, setCurrentPage, conges, agents, notifications: allNotifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const meta = pageTitles[currentPage] ?? { title: "Page", breadcrumb: [] };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = search.length > 1 ? [
    ...conges.filter(c => c.agent.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 4).map(c => ({ key: `conge-${c.id}`, label: `${c.id} — ${c.agent}`, page: "conge-liste" })),
    ...agents.filter(a => a.nom.toLowerCase().includes(search.toLowerCase()) || a.matricule.includes(search))
      .slice(0, 4).map(a => ({ key: `agent-${a.id}`, label: `${a.nom} — ${a.matricule}`, page: "agents" })),
  ] : [];

  const goToResult = (page: string) => {
    setCurrentPage(page);
    setSearch("");
  };

  const notifications = allNotifications
    .filter(n => n.audience === "agent" ? n.matricule === currentUser?.matricule : currentUser?.role !== "agent")
    .slice(0, 8);
  const unreadCount = notifications.filter(n => !n.read).length;

  const openNotification = (n: (typeof notifications)[number]) => {
    markNotificationRead(n.id);
    setNotifOpen(false);
    if (n.page) setCurrentPage(n.page);
  };

  const handleMarkAllRead = () => {
    if (!currentUser) return;
    markAllNotificationsRead(currentUser.role === "agent" ? "agent" : "actors", currentUser.matricule);
  };

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 py-3.5 flex items-center gap-4">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
          <span>Accueil</span>
          {meta.breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span>/</span>
              <span className={i === meta.breadcrumb.length - 1 ? "text-[#E8751A] font-medium" : ""}>{b}</span>
            </span>
          ))}
        </nav>
        <h1 className="text-base font-bold text-gray-800 font-[family-name:var(--font-display)] leading-tight">{meta.title}</h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-56">
          <Search size={14} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400 w-full" />
        </div>
        {searchResults.length > 0 && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden">
            {searchResults.map(r => (
              <button key={r.key} onClick={() => goToResult(r.page)} className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E8751A] rounded-full" />}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-xl z-20">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-800 font-[family-name:var(--font-display)]">Notifications</span>
              <span className="text-xs bg-[#E8751A] text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} onClick={() => openNotification(n)} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!n.read ? "bg-orange-50/40" : ""}`}>
                  <div className="flex gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      n.type === "danger" ? "bg-red-400" : n.type === "success" ? "bg-green-400" : n.type === "warning" ? "bg-amber-400" : "bg-blue-400"
                    }`} />
                    <div>
                      <p className={`text-xs ${n.read ? "text-gray-600" : "text-gray-800 font-medium"}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.detail}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.date} {n.heure}</p>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <p className="px-4 py-6 text-center text-xs text-gray-400">Aucune notification</p>}
            </div>
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 text-center border-t border-gray-50">
                <button onClick={handleMarkAllRead} className="text-xs text-[#E8751A] font-medium hover:underline">Tout marquer comme lu</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User */}
      {currentUser && (
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center overflow-hidden flex-shrink-0">
              {currentUser.avatar ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" /> : (
                <span className="text-white text-xs font-bold">{currentUser.prenom[0]}{currentUser.nom[0]}</span>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{currentUser.prenom}</p>
              <p className="text-xs text-gray-500">{roleLabel(currentUser.role)}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 hidden md:block transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{currentUser.prenom} {currentUser.nom}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
              <button
                onClick={() => { setProfileOpen(false); setCurrentPage("compte"); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings size={15} className="text-gray-400" />Mon compte
              </button>
              <button
                onClick={() => { setProfileOpen(false); setCurrentUser(null); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50"
              >
                <LogOut size={15} />Déconnexion
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
