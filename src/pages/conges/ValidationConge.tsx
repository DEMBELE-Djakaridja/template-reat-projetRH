import { useState } from "react";
import Card from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import { Textarea } from "../../components/UI/Input";
import { CheckCircle, XCircle, Eye, Clock, AlertTriangle, Filter, FileText } from "lucide-react";
import { useApp, DIRECTIONS, type UserRole } from "../../context/AppContext";

const PERM_VALIDATOR_ROLES: UserRole[] = ["admin", "sous-directeur", "directeur"];

export default function ValidationConge() {
  const { currentUser, currentPage, conges, permissions, decideConge, decidePermission } = useApp();
  const isPermission = currentPage === "perm-validation";
  const canValidatePermission = !!currentUser && PERM_VALIDATOR_ROLES.includes(currentUser.role);

  const pending = isPermission
    ? permissions.filter(p => p.statut === "pending").map(p => ({ id: p.id, agent: p.agent, matricule: p.matricule, direction: p.direction, type: "Permission", debut: p.date, fin: p.date, duree: parseFloat(p.duree) || 1, soumis: p.date, urgence: false, motif: p.motif, fichiers: undefined as string[] | undefined }))
    : conges.filter(c => c.statut === "pending" || c.statut === "warning" || c.statut === "info").map(c => ({ id: c.id, agent: c.agent, matricule: c.matricule, direction: c.direction, type: c.type, debut: c.debut, fin: c.fin, duree: c.duree, soumis: c.soumis, urgence: c.urgence, motif: c.motif, fichiers: c.fichiers }));

  const [selected, setSelected] = useState<string[]>([]);
  const [actionModal, setActionModal] = useState<{ type: "validate" | "reject"; ids: string[] } | null>(null);
  const [comment, setComment] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDirection, setFilterDirection] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const directions = ["all", ...DIRECTIONS];
  const visible = filterDirection === "all" ? pending : pending.filter(d => d.direction === filterDirection);

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(prev => prev.length === visible.length ? [] : visible.map(d => d.id));

  const rejectMotifMissing = actionModal?.type === "reject" && !comment.trim();

  const confirm = () => {
    if (!actionModal) return;
    if (rejectMotifMissing) return;
    const action = actionModal.type === "validate" ? "approve" : "reject";
    if (isPermission) decidePermission(actionModal.ids, action, comment || undefined);
    else decideConge(actionModal.ids, action, comment || undefined);
    setSelected([]);
    setActionModal(null);
    setComment("");
  };

  const detail = detailId ? pending.find(d => d.id === detailId) ?? null : null;

  if (isPermission && !canValidatePermission) {
    return (
      <Card>
        <div className="py-10 text-center">
          <CheckCircle size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">Vous n'avez pas accès au traitement des demandes de permission.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "En attente de validation", val: pending.length, icon: <Clock size={18} />, color: "text-orange-500" },
          { label: "Urgentes", val: pending.filter(d => d.urgence).length, icon: <AlertTriangle size={18} />, color: "text-red-500" },
          { label: "Directions concernées", val: new Set(pending.map(d => d.direction)).size, icon: <CheckCircle size={18} />, color: "text-green-500" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
            <span className={s.color}>{s.icon}</span>
            <div>
              <p className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-display)]">{s.val}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700"><strong className="text-[#E8751A]">{selected.length}</strong> demande{selected.length > 1 ? "s" : ""} sélectionnée{selected.length > 1 ? "s" : ""}</span>
          <div className="flex gap-2">
            <Button variant="success" size="sm" icon={<CheckCircle size={14} />} onClick={() => setActionModal({ type: "validate", ids: selected })}>
              Valider la sélection
            </Button>
            <Button variant="danger" size="sm" icon={<XCircle size={14} />} onClick={() => setActionModal({ type: "reject", ids: selected })}>
              Rejeter la sélection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 font-[family-name:var(--font-display)]">Demandes en attente</h3>
            <p className="text-xs text-gray-500">{visible.length} demande{visible.length > 1 ? "s" : ""} à traiter</p>
          </div>
          <Button variant="outline" size="sm" icon={<Filter size={14} />} onClick={() => setShowFilters(v => !v)}>Filtrer</Button>
        </div>
        {showFilters && (
          <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-2">
            <span className="text-xs text-gray-500">Direction :</span>
            <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white form-input">
              {directions.map(d => <option key={d} value={d}>{d === "all" ? "Toutes" : d}</option>)}
            </select>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle size={40} className="text-green-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Toutes les demandes ont été traitées !</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-3">
                    <input type="checkbox" checked={selected.length === visible.length && visible.length > 0}
                      onChange={toggleAll} className="rounded accent-[#E8751A]" />
                  </th>
                  {["Référence", "Agent", "Type", "Période", "Durée", "Soumise le", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs text-gray-400 font-medium px-3 py-3 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map(d => (
                  <tr key={d.id} className={`table-row ${selected.includes(d.id) ? "bg-orange-50/50" : ""}`}>
                    <td className="px-6 py-3.5">
                      <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)}
                        className="rounded accent-[#E8751A]" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {d.urgence && <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />}
                        <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{d.id}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{d.agent[0]}</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800">{d.agent}</p>
                          <p className="text-xs text-gray-400">{d.direction}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-gray-600">{d.type}</td>
                    <td className="px-3 py-3.5 text-xs text-gray-600">
                      <span>{d.debut}</span><span className="text-gray-400 mx-1">→</span><span>{d.fin}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{d.duree}j</span>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-gray-400">{d.soumis}</td>
                    <td className="px-3 py-3.5 pr-6">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetailId(d.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors" title="Voir"><Eye size={14} /></button>
                        <button onClick={() => setActionModal({ type: "validate", ids: [d.id] })} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-500 transition-colors" title="Valider"><CheckCircle size={14} /></button>
                        <button onClick={() => setActionModal({ type: "reject", ids: [d.id] })} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Rejeter"><XCircle size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.type === "validate" ? "Confirmer la validation" : "Confirmer le rejet"}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setActionModal(null)}>Annuler</Button>
            <Button variant={actionModal?.type === "validate" ? "secondary" : "danger"} size="sm" onClick={confirm} disabled={rejectMotifMissing}>
              {actionModal?.type === "validate" ? "Valider" : "Rejeter"}
            </Button>
          </>
        }
      >
        <div className={`rounded-xl p-4 mb-4 ${actionModal?.type === "validate" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <p className="text-sm font-medium text-gray-700">
            {actionModal?.type === "validate"
              ? `Vous allez valider ${actionModal.ids.length} demande(s).`
              : `Vous allez rejeter ${actionModal?.ids.length} demande(s).`}
          </p>
        </div>
        <Textarea
          label={actionModal?.type === "validate" ? "Commentaire (optionnel)" : "Motif du rejet *"}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={actionModal?.type === "validate" ? "Ajoutez un commentaire..." : "Expliquez le motif du rejet..."}
        />
        {rejectMotifMissing && <p className="text-xs text-red-600 mt-1.5">Le motif du rejet est obligatoire.</p>}
      </Modal>

      {/* Detail / pièces justificatives */}
      <Modal open={!!detail} onClose={() => setDetailId(null)} title={detail ? `${detail.id} — ${detail.agent}` : ""}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-xs text-gray-500 block">Type</span><span className="font-semibold text-gray-800">{detail.type}</span></div>
              <div><span className="text-xs text-gray-500 block">Direction</span><span className="font-semibold text-gray-800">{detail.direction}</span></div>
              <div><span className="text-xs text-gray-500 block">Période</span><span className="font-semibold text-gray-800">{detail.debut} → {detail.fin}</span></div>
              <div><span className="text-xs text-gray-500 block">Durée</span><span className="font-semibold text-gray-800">{detail.duree}j</span></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Motif</p>
              <p className="text-gray-700">{detail.motif || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Pièces justificatives</p>
              {detail.fichiers && detail.fichiers.length > 0 ? (
                <ul className="space-y-1.5">
                  {detail.fichiers.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                      <FileText size={13} className="text-[#E8751A]" />{f}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">Aucune pièce jointe fournie.</p>
              )}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Button size="sm" icon={<CheckCircle size={14} />} onClick={() => { setActionModal({ type: "validate", ids: [detail.id] }); setDetailId(null); }}>Valider</Button>
              <Button variant="danger" size="sm" icon={<XCircle size={14} />} onClick={() => { setActionModal({ type: "reject", ids: [detail.id] }); setDetailId(null); }}>Rejeter</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
