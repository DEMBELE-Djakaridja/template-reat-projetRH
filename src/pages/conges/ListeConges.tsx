import { useState } from "react";
import Card from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import { Textarea } from "../../components/UI/Input";
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, Plus, Trash2, Calendar, History, FileText, Paperclip, UserCheck } from "lucide-react";
import { useApp, DIRECTIONS, type UserRole, type CongeRequest } from "../../context/AppContext";
import { downloadCsv } from "../../lib/csv";
import { downloadActePdf } from "../../lib/pdf";

const statutConfig: Record<string, { label: string; badge: any }> = {
  pending: { label: "En attente", badge: "pending" },
  success: { label: "Validée", badge: "success" },
  warning: { label: "En cours", badge: "warning" },
  danger: { label: "Rejetée", badge: "danger" },
  info: { label: "En cours", badge: "info" },
};

const VALIDATOR_ROLES: UserRole[] = ["admin", "gestionnaire-rh", "sous-directeur", "directeur"];
// Une fois validée par le Directeur (statut "info"), la demande n'est plus actionnable par les
// validateurs : elle attend l'acte de cessation, seule chose qui vaut validation finale.
const ACTIONABLE_STATUTS = ["pending", "warning"];

const PAGE_SIZE = 5;

export default function ListeConges() {
  const { currentUser, conges, actes, journal, setCurrentPage, deleteConge, decideConge } = useApp();
  const canValidate = !!currentUser && VALIDATOR_ROLES.includes(currentUser.role);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDirection, setFilterDirection] = useState("all");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const directions = ["all", ...DIRECTIONS];

  const filtered = conges.filter(d => {
    const matchSearch = d.agent.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "all" || d.statut === filterStatut;
    const matchDirection = filterDirection === "all" || d.direction === filterDirection;
    return matchSearch && matchStatut && matchDirection;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPageClamped = Math.min(page, pageCount);
  const paginated = filtered.slice((currentPageClamped - 1) * PAGE_SIZE, currentPageClamped * PAGE_SIZE);

  const detail: CongeRequest | null = detailId ? conges.find(d => d.id === detailId) ?? null : null;
  const historique = detail ? journal.filter(e => e.detail.includes(detail.id)).sort((a, b) => a.id - b.id) : [];
  const canActOnDetail = !!detail && canValidate && ACTIONABLE_STATUTS.includes(detail.statut);
  const isOwnerAgent = !!detail && currentUser?.role === "agent" && currentUser.matricule === detail.matricule;
  const acteSigne = detail && isOwnerAgent ? actes.find(a => a.congeId === detail.id && a.statut === "signe") : undefined;
  const rejectMotifMissing = !comment.trim();

  const closeDetail = () => { setDetailId(null); };

  const handleDelete = (id: string, agent: string) => {
    if (window.confirm(`Supprimer la demande ${id} (${agent}) ? Cette action est irréversible.`)) deleteConge(id);
  };

  const handleValider = () => {
    if (!detail) return;
    decideConge([detail.id], "approve");
    closeDetail();
  };

  const openReject = () => {
    if (!detail) return;
    setRejectId(detail.id);
    setComment("");
    setDetailId(null);
  };

  const closeReject = () => { setRejectId(null); setComment(""); };

  const confirmReject = () => {
    if (!rejectId || rejectMotifMissing) return;
    decideConge([rejectId], "reject", comment);
    closeReject();
  };

  const exportCsv = () => {
    downloadCsv("conges", filtered.map(d => ({
      Reference: d.id, Agent: d.agent, Matricule: d.matricule, Type: d.type,
      Debut: d.debut, Fin: d.fin, Duree: d.duree, Direction: d.direction, Statut: statutConfig[d.statut]?.label ?? d.statut,
    })));
  };

  return (
    <div className="space-y-5">
      {/* Filters bar */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher par agent, référence..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 form-input"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {["all", "pending", "success", "warning", "danger"].map(s => (
              <button
                key={s}
                onClick={() => { setFilterStatut(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterStatut === s ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {s === "all" ? "Tous" : statutConfig[s]?.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" icon={<Filter size={14} />} onClick={() => setShowFilters(v => !v)}>Filtres</Button>
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportCsv}>Exporter</Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setCurrentPage("conge-nouvelle")}>
            Nouvelle demande
          </Button>
        </div>
        {showFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Direction :</span>
            <select value={filterDirection} onChange={e => { setFilterDirection(e.target.value); setPage(1); }}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white form-input">
              {directions.map(d => <option key={d} value={d}>{d === "all" ? "Toutes" : d}</option>)}
            </select>
          </div>
        )}
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", val: conges.length, icon: <Clock size={16} />, color: "text-gray-600" },
          { label: "En attente", val: conges.filter(d => d.statut === "pending").length, icon: <Clock size={16} />, color: "text-orange-500" },
          { label: "Validées", val: conges.filter(d => d.statut === "success").length, icon: <CheckCircle size={16} />, color: "text-green-500" },
          { label: "Rejetées", val: conges.filter(d => d.statut === "danger").length, icon: <XCircle size={16} />, color: "text-red-500" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <span className={s.color}>{s.icon}</span>
            <div>
              <p className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)]">{s.val}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 font-[family-name:var(--font-display)]">Liste des demandes</h3>
            <p className="text-xs text-gray-500">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Référence", "Agent", "Type", "Période", "Durée", "Direction", "Statut", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-3 first:pl-6 last:pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(d => (
                <tr key={d.id} className="table-row group">
                  <td className="px-4 py-3.5 pl-6">
                    <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{d.id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{d.agent.split(" ")[0][0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 leading-tight">{d.agent}</p>
                        <p className="text-xs text-gray-400">{d.matricule}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600 font-medium">{d.type}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">
                    <span>{d.debut}</span>
                    <span className="text-gray-400 mx-1">→</span>
                    <span>{d.fin}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-full">{d.duree}j</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{d.direction}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={statutConfig[d.statut]?.badge} dot size="sm">
                      {statutConfig[d.statut]?.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 pr-6">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setDetailId(d.id)}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#E8751A]"
                        title="Voir"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id, d.agent)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400">Aucune demande ne correspond à ces filtres.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-6 py-3.5 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Affichage de {filtered.length === 0 ? 0 : (currentPageClamped - 1) * PAGE_SIZE + 1} à {Math.min(currentPageClamped * PAGE_SIZE, filtered.length)} sur {filtered.length} entrées
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === currentPageClamped ? "bg-[#E8751A] text-white" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>

      <Modal
        open={!!detail}
        onClose={closeDetail}
        title="Détail de la demande"
        size="lg"
        footer={
          canActOnDetail ? (
            <>
              <Button variant="danger" size="sm" onClick={openReject}>
                Rejeter
              </Button>
              <Button variant="primary" size="sm" icon={<CheckCircle size={14} />} onClick={handleValider}>
                Valider
              </Button>
            </>
          ) : acteSigne ? (
            <>
              <Button variant="ghost" size="sm" onClick={closeDetail}>Fermer</Button>
              <Button variant="primary" size="sm" icon={<Download size={14} />} onClick={() => downloadActePdf(acteSigne)}>
                Télécharger l'acte de cessation
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={closeDetail}>Fermer</Button>
          )
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Numéro de demande</p><p className="font-semibold text-gray-800 font-mono">{detail.id}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Agent</p><p className="font-semibold text-gray-800">{detail.agent}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Matricule</p><p className="font-semibold text-gray-800 font-mono">{detail.matricule}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Type</p><p className="font-semibold text-gray-800">{detail.type}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Direction</p><p className="font-semibold text-gray-800">{detail.direction}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Durée</p><p className="font-semibold text-gray-800">{detail.duree} jour{detail.duree > 1 ? "s" : ""}</p></div>
              <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Calendar size={12} />Période</p>
                <p className="font-semibold text-gray-800">Du {detail.debut} au {detail.fin}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 col-span-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">Statut</p>
                <Badge variant={statutConfig[detail.statut]?.badge} dot size="sm">{statutConfig[detail.statut]?.label}</Badge>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Motif</p>
              <p className="text-sm text-gray-700">{detail.motif || "—"}</p>
              {detail.statut === "danger" && detail.motifRejet && (
                <p className="text-xs text-red-600 mt-1.5">Motif du rejet : {detail.motifRejet}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5"><Paperclip size={13} />Pièces justificatives</p>
              {detail.fichiers && detail.fichiers.length > 0 ? (
                <div className="space-y-1.5">
                  {detail.fichiers.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                      <FileText size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Aucune pièce jointe à cette demande.</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><History size={13} className="text-[#E8751A]" />Historique</p>
              <div className="space-y-2">
                {historique.length === 0 && <p className="text-xs text-gray-400">Aucun évènement enregistré.</p>}
                {historique.map(e => (
                  <div key={e.id} className="flex items-start gap-2">
                    {e.type === "danger" ? <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" /> :
                      e.type === "success" ? <CheckCircle size={14} className="text-green-600 mt-0.5 flex-shrink-0" /> :
                        <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className="text-xs text-gray-700">{e.action}{e.action === "Soumission congé" ? " — soumise par l'agent" : ""}</p>
                      <p className="text-[10px] text-gray-400">{e.date} · {e.heure}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {detail.imputeA && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-[#E8751A] uppercase tracking-wide mb-2 flex items-center gap-1.5"><UserCheck size={13} />Imputée au Sous-Directeur DRH</p>
                <p className="text-sm text-gray-700">{detail.imputeA}</p>
              </div>
            )}

            {detail.imputeGDRH && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-[#E8751A] uppercase tracking-wide mb-2 flex items-center gap-1.5"><UserCheck size={13} />Imputée au Gestionnaire DRH</p>
                <p className="text-sm text-gray-700">{detail.imputeGDRH}</p>
                <p className="text-xs text-gray-400 mt-1">L'acte de cessation est en cours de production.</p>
              </div>
            )}

          </div>
        )}
      </Modal>

      <Modal
        open={!!rejectId}
        onClose={closeReject}
        title="Confirmer le rejet"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeReject}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={confirmReject} disabled={rejectMotifMissing}>Rejeter</Button>
          </>
        }
      >
        <Textarea
          label="Motif du rejet *"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Expliquez le motif du rejet..."
        />
        {rejectMotifMissing && <p className="text-xs text-red-600 mt-1.5">Le motif du rejet est obligatoire.</p>}
      </Modal>
    </div>
  );
}
