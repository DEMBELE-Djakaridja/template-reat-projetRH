import { useState } from "react";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import { Select } from "../../components/UI/Input";
import { Calendar, UserCheck, ClipboardList, Send } from "lucide-react";
import { useApp, type UserRole } from "../../context/AppContext";

const IMPUTATION_ROLES: UserRole[] = ["admin", "drh", "sous-directeur-drh"];

export default function ImputationConge() {
  const { currentUser, conges, users, imputerConge, imputerCongeGDRH } = useApp();
  const canImputer = !!currentUser && IMPUTATION_ROLES.includes(currentUser.role);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [collaborateur, setCollaborateur] = useState("");

  // Étape 1 (DRH → Sous-Directeur DRH) et étape 2 (Sous-Directeur DRH → Gestionnaire DRH),
  // uniquement pour les demandes déjà validées par le circuit Gestionnaire RH/Sous-Directeur/Directeur.
  const stageFor = (c: (typeof conges)[number]): 1 | 2 | null => {
    if (c.statut !== "info") return null;
    if (!c.imputeA) return 1;
    if (!c.imputeGDRH) return 2;
    return null;
  };

  const canActOn = (c: (typeof conges)[number]) => {
    const stage = stageFor(c);
    if (!stage || !currentUser) return false;
    if (currentUser.role === "admin") return true;
    if (stage === 1) return currentUser.role === "drh";
    return currentUser.role === "sous-directeur-drh" && currentUser.matricule === c.imputeMatricule;
  };

  const eligibles = conges.filter(canActOn);

  const detail = detailId ? conges.find(c => c.id === detailId) ?? null : null;
  const detailStage = detail ? stageFor(detail) : null;
  const sousDirecteursDrh = users.filter(u => u.role === "sous-directeur-drh" && u.actif !== false);
  const gestionnairesDrh = users.filter(u => u.role === "gestionnaire-drh" && u.actif !== false);

  const openDetail = (id: string) => { setDetailId(id); setCollaborateur(""); };
  const closeDetail = () => { setDetailId(null); setCollaborateur(""); };

  const confirmImputation = () => {
    if (!detail || !collaborateur) return;
    if (detailStage === 1) imputerConge(detail.id, collaborateur);
    else if (detailStage === 2) imputerCongeGDRH(detail.id, collaborateur);
    closeDetail();
  };

  if (!canImputer) {
    return (
      <Card>
        <div className="py-10 text-center">
          <UserCheck size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">Vous n'avez pas accès à l'imputation des demandes.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800 font-[family-name:var(--font-display)]">Imputation des demandes</h2>
      </div>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-800 font-[family-name:var(--font-display)]">Demandes en attente d'imputation</h3>
          <p className="text-xs text-gray-500">{eligibles.length} demande{eligibles.length > 1 ? "s" : ""}</p>
        </div>
        {eligibles.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Aucune demande en attente d'imputation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Référence", "Agent", "Type", "Période", "Durée"].map(h => (
                    <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-3 first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {eligibles.map(d => (
                  <tr key={d.id} onClick={() => openDetail(d.id)} className="table-row cursor-pointer hover:bg-orange-50/40 transition-colors">
                    <td className="px-4 py-3.5 pl-6"><span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{d.id}</span></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{d.agent.split(" ")[0][0]}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 leading-tight">{d.agent}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600 font-medium">{d.type}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      <span>{d.debut}</span><span className="text-gray-400 mx-1">→</span><span>{d.fin}</span>
                    </td>
                    <td className="px-4 py-3.5 pr-6">
                      <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-full">{d.duree}j</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!detail}
        onClose={closeDetail}
        title="Détail de la demande"
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeDetail}>Annuler</Button>
            <Button variant="primary" size="sm" icon={<Send size={14} />} onClick={confirmImputation} disabled={!collaborateur}>
              {detailStage === 1 ? "Imputer au Sous-Directeur DRH" : "Imputer au Gestionnaire DRH"}
            </Button>
          </>
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
              {detail.imputeA && (
                <div className="bg-gray-50 rounded-xl p-3 col-span-2"><p className="text-xs text-gray-500 mb-0.5">Sous-Directeur DRH désigné</p><p className="font-semibold text-gray-800">{detail.imputeA}</p></div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Motif</p>
              <p className="text-sm text-gray-700">{detail.motif || "—"}</p>
            </div>

            <div>
              <Select
                label={detailStage === 1 ? "Sous-Directeur DRH à désigner" : "Gestionnaire DRH à désigner"}
                required
                placeholder="Sélectionner un collaborateur..."
                value={collaborateur}
                onChange={e => setCollaborateur(e.target.value)}
                options={(detailStage === 1 ? sousDirecteursDrh : gestionnairesDrh).map(u => ({ value: u.matricule, label: `${u.nom} ${u.prenom} — ${u.matricule}` }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
