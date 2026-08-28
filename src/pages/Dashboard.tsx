import Card, { CardHeader, CardTitle } from "../components/UI/Card";
import Badge from "../components/UI/Badge";
import { Clock, CheckCircle, XCircle, FileText, ChevronRight, ArrowUpRight } from "lucide-react";
import { useApp } from "../context/AppContext";

const statutMap: Record<string, { label: string; v: "pending" | "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "En attente", v: "pending" },
  success: { label: "Validée", v: "success" },
  warning: { label: "En cours", v: "warning" },
  danger: { label: "Rejetée", v: "danger" },
  info: { label: "En cours", v: "info" },
};

export default function Dashboard() {
  const { conges, permissions, setCurrentPage } = useApp();

  const totalDemandes = conges.length + permissions.length;
  const congesEnAttente = conges.filter(c => c.statut === "pending" || c.statut === "warning" || c.statut === "info").length;
  const permissionsEnAttente = permissions.filter(p => p.statut !== "success" && p.statut !== "danger").length;
  const validees = conges.filter(c => c.statut === "success").length + permissions.filter(p => p.statut === "success").length;
  const rejetees = conges.filter(c => c.statut === "danger").length + permissions.filter(p => p.statut === "danger").length;

  const stats = [
    { label: "Total Demandes", value: totalDemandes, icon: <FileText size={20} />, color: "from-blue-400 to-blue-600", trend: "up" as const },
    { label: "Demandes En Attente", value: congesEnAttente + permissionsEnAttente, icon: <Clock size={20} />, color: "from-orange-400 to-orange-600", trend: "up" as const },
    { label: "Demande(s) Validée(s)", value: validees, icon: <CheckCircle size={20} />, color: "from-green-400 to-green-600", trend: "up" as const },
    { label: "Demande(s) Rejetée(s)", value: rejetees, icon: <XCircle size={20} />, color: "from-red-400 to-red-600", trend: rejetees > 0 ? "down" as const : "up" as const },
  ];

  const recentDemandes = conges.slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-display)]">
        Bienvenue sur votre Tableau de Bord
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-sm`}>
                {s.icon}
              </div>
              <ArrowUpRight size={16} className={s.trend === "up" ? "text-green-500" : "text-red-500"} />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800 font-[family-name:var(--font-display)]">{s.value}</p>
              <p className="text-xs font-medium text-gray-600 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-5">
        {/* Recent */}
        <Card padding="none">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <div>
              <CardTitle>Demandes récentes</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Dernières soumissions</p>
            </div>
            <button onClick={() => setCurrentPage("conge-liste")} className="text-xs text-[#E8751A] font-medium flex items-center gap-1 hover:underline">
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-gray-50">
                  <th className="text-left text-xs text-gray-400 font-medium px-6 py-2.5">Réf.</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-3 py-2.5">Agent</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-3 py-2.5">Type</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-3 py-2.5">Durée</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-3 py-2.5 pr-6">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentDemandes.map(d => (
                  <tr key={d.id} onClick={() => setCurrentPage("conge-liste")} className="table-row cursor-pointer">
                    <td className="px-6 py-3 text-xs font-mono text-gray-500">{d.id}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{d.agent.split(" ")[0][0]}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-700">{d.agent}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{d.type}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{d.duree} jours</td>
                    <td className="px-3 py-3 pr-6">
                      <Badge variant={statutMap[d.statut].v} dot size="sm">{statutMap[d.statut].label}</Badge>
                    </td>
                  </tr>
                ))}
                {recentDemandes.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Aucune demande pour le moment.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
