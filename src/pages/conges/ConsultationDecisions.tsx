import { useState } from "react";
import Card from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import { Search, Eye, FileText, CheckCircle, XCircle } from "lucide-react";
import Modal from "../../components/UI/Modal";
import { useApp } from "../../context/AppContext";

const statutMap: Record<string, { badge: any; label: string }> = {
  draft: { badge: "default", label: "Brouillon" },
  pending: { badge: "pending", label: "En attente de signature" },
  signed: { badge: "success", label: "Signée" },
};

function anneeConcernee(dateCreation: string) {
  const [, , y] = dateCreation.split("/");
  return y ?? "—";
}

export default function ConsultationDecisions() {
  const { decisions, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [consultId, setConsultId] = useState<string | null>(null);

  const types = ["all", ...Array.from(new Set(decisions.map(d => d.type)))];

  const filtered = decisions.filter(d => {
    const matchSearch = d.id.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || d.type === filterType;
    return matchSearch && matchType;
  });

  const consulted = consultId ? decisions.find(d => d.id === consultId) ?? null : null;
  const isConcerned = consulted?.agents.some(a => a.matricule === currentUser?.matricule) ?? false;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800 font-[family-name:var(--font-display)]">Décisions de congé</h2>
        <p className="text-sm text-gray-500">Consultez les décisions de congé disponibles et vérifiez si vous y figurez</p>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par numéro de décision..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white form-input" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white form-input">
            {types.map(t => <option key={t} value={t}>{t === "all" ? "Tous les types" : t}</option>)}
          </select>
        </div>
      </Card>

      <Card padding="none">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">
              {filterType === "all" ? "Aucune décision de congé disponible" : `Il n'y a pas de décision de ${filterType.toLowerCase()} disponible`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Type de décision", "Numéro de décision", "Date de signature", "Année concernée", "Statut de traitement", "Action"].map(h => (
                    <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-3 first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => (
                  <tr key={d.id} className="table-row">
                    <td className="px-4 py-3.5 pl-6 text-xs font-medium text-gray-700">{d.type}</td>
                    <td className="px-4 py-3.5"><span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{d.id}</span></td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">{d.dateSignature ?? "—"}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">{anneeConcernee(d.dateCreation)}</td>
                    <td className="px-4 py-3.5"><Badge variant={statutMap[d.statut].badge} dot size="sm">{statutMap[d.statut].label}</Badge></td>
                    <td className="px-4 py-3.5 pr-6">
                      <button onClick={() => setConsultId(d.id)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#E8751A] font-medium transition-colors">
                        <Eye size={13} />Consulter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!consulted} onClose={() => setConsultId(null)} title={consulted ? `Décision ${consulted.id}` : ""} size="lg">
        {consulted && (
          <div className="space-y-4">
            <div className={`rounded-xl p-4 flex items-center gap-3 border ${isConcerned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
              {isConcerned ? <CheckCircle size={20} className="text-green-600 flex-shrink-0" /> : <XCircle size={20} className="text-gray-400 flex-shrink-0" />}
              <p className="text-sm font-medium text-gray-700">
                {isConcerned ? "Vous figurez dans cette décision de congé." : "Vous ne figurez pas dans cette décision de congé."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Titre</p><p className="font-semibold text-gray-800">{consulted.titre}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Type</p><p className="font-semibold text-gray-800">{consulted.type}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Statut</p><Badge variant={statutMap[consulted.statut].badge} dot size="sm">{statutMap[consulted.statut].label}</Badge></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Date de signature</p><p className="font-semibold text-gray-800">{consulted.dateSignature ?? "Non signée"}</p></div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Agents concernés</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Agent</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Matricule</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Période</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {consulted.agents.map((a, i) => (
                      <tr key={i} className={a.matricule === currentUser?.matricule ? "bg-orange-50" : ""}>
                        <td className="px-3 py-2 font-medium text-gray-800">{a.nom}</td>
                        <td className="px-3 py-2 font-mono text-gray-500">{a.matricule}</td>
                        <td className="px-3 py-2 text-gray-500">{a.debut || "—"} → {a.fin || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
