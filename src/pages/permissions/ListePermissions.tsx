import { useState } from "react";
import Card from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import Button from "../../components/UI/Button";
import { useApp, type UserRole, type PermissionRequest, type User } from "../../context/AppContext";
import { Download, Eye, Plus, FileText, Search, CheckCircle, Send } from "lucide-react";
import { downloadTextFile, downloadCsv } from "../../lib/csv";
import Modal from "../../components/UI/Modal";
import { Textarea } from "../../components/UI/Input";

const statutMap: Record<string, { badge: any; label: string }> = {
  pending: { badge: "pending", label: "En attente" },
  attente_sous_directeur: { badge: "warning", label: "En cours" },
  attente_directeur: { badge: "warning", label: "En cours" },
  attente_transmission_grh: { badge: "info", label: "En cours" },
  attente_acte: { badge: "info", label: "En cours" },
  success: { badge: "success", label: "Validée" },
  danger: { badge: "danger", label: "Rejetée" },
};

// Circuit : Gestionnaire RH valide/impute → Sous-Directeur valide → Directeur valide/retransmet →
// Sous-Directeur transmet → Gestionnaire RH établit l'acte administratif.
type PermAction = "decide" | "transmit" | "create-acte" | null;

function getPermAction(p: PermissionRequest, user: User | null): PermAction {
  if (!user) return null;
  const isAdmin = user.role === "admin";
  switch (p.statut) {
    case "pending": return (user.role === "gestionnaire-rh" || isAdmin) ? "decide" : null;
    case "attente_sous_directeur": return (user.role === "sous-directeur" || isAdmin) ? "decide" : null;
    case "attente_directeur": return (user.role === "directeur" || isAdmin) ? "decide" : null;
    case "attente_transmission_grh": return (user.role === "sous-directeur" || isAdmin) ? "transmit" : null;
    case "attente_acte": return (user.role === "gestionnaire-rh" || isAdmin) ? "create-acte" : null;
    default: return null;
  }
}

export default function ListePermissions() {
  const { currentUser, permissions, setCurrentPage, decidePermission, transmettrePermission, creerActePermission } = useApp();
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const filtered = permissions.filter(p =>
    p.agent.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  );

  const detail = detailId ? permissions.find(p => p.id === detailId) ?? null : null;
  const permAction = detail ? getPermAction(detail, currentUser) : null;
  const rejectMotifMissing = !comment.trim();
  const canValidate = !!currentUser && ["admin", "gestionnaire-rh", "sous-directeur", "directeur"].includes(currentUser.role);

  const closeDetail = () => { setDetailId(null); };

  const handleValider = () => {
    if (!detail) return;
    decidePermission([detail.id], "approve");
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
    decidePermission([rejectId], "reject", comment);
    closeReject();
  };

  const handleTransmettre = () => {
    if (!detail) return;
    transmettrePermission(detail.id);
    closeDetail();
  };

  const handleCreerActe = () => {
    if (!detail) return;
    creerActePermission(detail.id);
    closeDetail();
  };

  const downloadActe = (p: typeof permissions[number]) => {
    downloadTextFile(`${p.id}-acte.txt`, `ACTE ADMINISTRATIF\nRéférence : ${p.id}\nAgent : ${p.agent} (${p.matricule})\nMotif : ${p.motif}\nDate : ${p.date}\nDurée : ${p.duree}\n`);
  };

  const exportCsv = () => {
    downloadCsv("permissions", filtered.map(p => ({ Reference: p.id, Agent: p.agent, Date: p.date, Motif: p.motif, Duree: p.duree, Statut: statutMap[p.statut]?.label ?? p.statut })));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white form-input" />
        </div>
        <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportCsv}>Exporter</Button>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setCurrentPage("perm-nouvelle")}>
          Nouvelle permission
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", val: permissions.length, color: "text-gray-700" },
          { label: "Validées", val: permissions.filter(p => p.statut === "success").length, color: "text-green-600" },
          { label: "Actes générés", val: permissions.filter(p => p.acte).length, color: "text-[#E8751A]" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className={`text-2xl font-bold font-[family-name:var(--font-display)] ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-800 font-[family-name:var(--font-display)]">{canValidate ? "Demandes de permission" : "Mes permissions"}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Référence", "Agent", "Date", "Motif", "Durée", "Statut", "Acte administratif", ""].map(h => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-3 first:pl-6 last:pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="table-row group">
                  <td className="px-4 py-3.5 pl-6"><span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{p.id}</span></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#009A4E] to-[#007A3D] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{p.agent[0]}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-800">{p.agent}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{p.date}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{p.motif}</td>
                  <td className="px-4 py-3.5"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-semibold">{p.duree}</span></td>
                  <td className="px-4 py-3.5"><Badge variant={statutMap[p.statut].badge} dot size="sm">{statutMap[p.statut].label}</Badge></td>
                  <td className="px-4 py-3.5">
                    {p.acte && currentUser?.role === "agent" && currentUser.matricule === p.matricule ? (
                      <button onClick={() => downloadActe(p)} className="flex items-center gap-1.5 text-xs text-[#009A4E] font-medium hover:underline">
                        <FileText size={12} />Télécharger l'acte administratif
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 pr-6">
                    <button onClick={() => setDetailId(p.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#E8751A] transition-all">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400">Aucune permission trouvée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!detail}
        onClose={closeDetail}
        title={detail ? `Permission ${detail.id}` : ""}
        footer={
          permAction === "decide" ? (
            <>
              <Button variant="danger" size="sm" onClick={openReject}>Rejeter</Button>
              <Button variant="primary" size="sm" icon={<CheckCircle size={14} />} onClick={handleValider}>Valider</Button>
            </>
          ) : permAction === "transmit" ? (
            <Button variant="primary" size="sm" icon={<Send size={14} />} onClick={handleTransmettre}>Transmettre au Gestionnaire RH</Button>
          ) : permAction === "create-acte" ? (
            <Button variant="primary" size="sm" icon={<FileText size={14} />} onClick={handleCreerActe}>Créer l'acte administratif</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={closeDetail}>Fermer</Button>
          )
        }
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-xs text-gray-500 block">Agent</span><span className="font-semibold text-gray-800">{detail.agent}</span></div>
              <div><span className="text-xs text-gray-500 block">Matricule</span><span className="font-semibold text-gray-800 font-mono">{detail.matricule}</span></div>
              <div><span className="text-xs text-gray-500 block">Direction</span><span className="font-semibold text-gray-800">{detail.direction}</span></div>
              <div><span className="text-xs text-gray-500 block">Date</span><span className="font-semibold text-gray-800">{detail.date}</span></div>
              <div><span className="text-xs text-gray-500 block">Durée</span><span className="font-semibold text-gray-800">{detail.duree}</span></div>
              <div><span className="text-xs text-gray-500 block">Statut</span><Badge variant={statutMap[detail.statut].badge} dot size="sm">{statutMap[detail.statut].label}</Badge></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Motif</p>
              <p className="text-gray-700">{detail.motif}</p>
            </div>
            {detail.motifRejet && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs text-red-500 mb-1">Motif du rejet</p>
                <p className="text-red-700">{detail.motifRejet}</p>
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
