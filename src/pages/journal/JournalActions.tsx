import { useState } from "react";
import Card from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import Button from "../../components/UI/Button";
import { Search, Download, Activity } from "lucide-react";
import { useApp, ROLE_LABELS, roleLabel as baseRoleLabel, type UserRole } from "../../context/AppContext";

const roleLabel = (role: string) => role === "system" ? "Système" : baseRoleLabel(role);
import { downloadCsv } from "../../lib/csv";

const typeConfig: Record<string, { badge: any; dot: string }> = {
  success: { badge: "success", dot: "bg-green-400" },
  danger: { badge: "danger", dot: "bg-red-400" },
  info: { badge: "info", dot: "bg-blue-400" },
  warning: { badge: "warning", dot: "bg-amber-400" },
  default: { badge: "default", dot: "bg-gray-300" },
};

const ACTION_GROUPS: Record<string, string> = {
  "Validation congé": "Validations", "Validation permission": "Validations",
  "Création décision": "Créations", "Création utilisateur": "Créations", "Création agent": "Créations",
  "Rejet congé": "Rejets", "Rejet permission": "Rejets", "Rejet demande": "Rejets",
  "Connexion": "Connexions", "Export données": "Exports",
  "Signature décision": "Validations", "Soumission congé": "Soumissions", "Soumission permission": "Soumissions",
};

export default function JournalActions() {
  const { journal } = useApp();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const filtered = journal.filter(j => {
    const ms = j.user.toLowerCase().includes(search.toLowerCase()) || j.action.toLowerCase().includes(search.toLowerCase()) || j.detail.toLowerCase().includes(search.toLowerCase());
    const mr = filterRole === "all" || j.role === filterRole;
    const mt = filterType === "all" || j.type === filterType;
    return ms && mr && mt;
  });

  const today = new Date().toLocaleDateString("fr-FR");
  const actionsToday = journal.filter(j => j.date === today).length;
  const activeUsers = new Set(journal.map(j => j.user)).size;
  const validations = journal.filter(j => j.action.startsWith("Validation") || j.action === "Signature décision").length;
  const alertes = journal.filter(j => j.type === "danger").length;

  const parUtilisateur = Object.entries(
    journal.reduce<Record<string, number>>((acc, j) => { acc[j.user] = (acc[j.user] ?? 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxUser = Math.max(1, ...parUtilisateur.map(([, n]) => n));

  const parType = Object.entries(
    journal.reduce<Record<string, number>>((acc, j) => {
      const label = ACTION_GROUPS[j.action] ?? "Autres";
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const typeColors: Record<string, string> = { Validations: "bg-green-400", Créations: "bg-blue-400", Rejets: "bg-red-400", Connexions: "bg-gray-300", Exports: "bg-amber-400", Soumissions: "bg-orange-400", Autres: "bg-purple-400" };

  const exportCsv = () => {
    downloadCsv("journal", filtered.map(j => ({ Utilisateur: j.user, Role: j.role, Action: j.action, Detail: j.detail, Date: j.date, Heure: j.heure, IP: j.ip })));
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dans le journal..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white form-input" />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white form-input">
            <option value="all">Tous les rôles</option>
            {[...(Object.keys(ROLE_LABELS) as UserRole[]), "system"].map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white form-input">
            <option value="all">Tous les types</option>
            <option value="success">Succès</option>
            <option value="danger">Erreur/Rejet</option>
            <option value="info">Information</option>
            <option value="warning">Avertissement</option>
          </select>
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportCsv}>Exporter</Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Actions aujourd'hui", val: actionsToday },
          { label: "Utilisateurs actifs", val: activeUsers },
          { label: "Validations", val: validations },
          { label: "Alertes", val: alertes },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-display)]">{s.val}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#E8751A]" />
                <h3 className="font-semibold text-gray-800 font-[family-name:var(--font-display)]">Journal des actions</h3>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length} entrées</span>
            </div>
            <div className="px-6 py-4 space-y-4">
              {filtered.map((j, i) => (
                <div key={j.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm
                      ${j.role === "system" ? "bg-gray-400" : "bg-gradient-to-br from-[#E8751A] to-[#C45E0D]"}`}>
                      {j.role === "system" ? "S" : j.user.split(" ").pop()?.[0] ?? "U"}
                    </div>
                    {i < filtered.length - 1 && <div className="w-0.5 flex-1 min-h-4 bg-gray-100 my-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">{j.user}</span>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{roleLabel(j.role)}</span>
                          <Badge variant={typeConfig[j.type].badge} size="sm">{j.action}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{j.detail}</p>
                        <p className="text-xs text-gray-400 mt-1 font-mono">{j.ip}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">{j.date}</p>
                        <p className="text-xs text-gray-400">{j.heure}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Aucune entrée ne correspond à ces filtres.</p>}
            </div>
          </Card>
        </div>

        {/* Sidebar stats */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-gray-800 font-[family-name:var(--font-display)] mb-4">Par utilisateur</h3>
            <div className="space-y-3">
              {parUtilisateur.map(([user, actions]) => (
                <div key={user} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-600 w-24 truncate">{user}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#E8751A] rounded-full" style={{ width: `${(actions / maxUser) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-4 text-right">{actions}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-800 font-[family-name:var(--font-display)] mb-4">Par type d'action</h3>
            <div className="space-y-2">
              {parType.map(([label, val]) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${typeColors[label] ?? "bg-gray-300"}`} />
                  <span className="text-xs text-gray-600 flex-1">{label}</span>
                  <span className="text-xs font-semibold text-gray-700">{val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
