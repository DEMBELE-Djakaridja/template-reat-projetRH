import { useState } from "react";
import Card, { CardHeader, CardTitle } from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import Button from "../../components/UI/Button";
import { FileText, Download, Plus, Trash2, Eye, FileCheck, Users } from "lucide-react";
import Modal from "../../components/UI/Modal";
import Input from "../../components/UI/Input";
import { useApp, hasOneYearService, type DecisionAgentRow } from "../../context/AppContext";
import { downloadDecisionPdf } from "../../lib/pdf";
import ConsultationDecisions from "./ConsultationDecisions";

const statutMap: Record<string, { badge: any; label: string }> = {
  draft: { badge: "default", label: "Brouillon" },
  pending: { badge: "pending", label: "En attente de signature" },
  signed: { badge: "success", label: "Signée" },
};

// La décision de congé ne concerne que les congés annuels.
const DECISION_TYPE = "Congé annuel";

export default function DecisionConge() {
  const { currentUser, decisions, agents, createDecision, signDecision } = useApp();
  const canManage = currentUser?.role === "admin" || currentUser?.role === "drh";
  const [showNew, setShowNew] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [newTitre, setNewTitre] = useState("");
  const [newAgents, setNewAgents] = useState<DecisionAgentRow[]>([]);
  const [pickerMatricule, setPickerMatricule] = useState("");

  const preview = previewId ? decisions.find(d => d.id === previewId) ?? null : null;

  const resetModal = () => { setShowNew(false); setNewTitre(""); setNewAgents([]); setPickerMatricule(""); };

  const handleCreate = () => {
    if (!newTitre || newAgents.length === 0) return;
    const record = createDecision({ titre: newTitre, type: DECISION_TYPE, agents: newAgents });
    resetModal();
    setPreviewId(record.id);
  };

  const addAgentToNew = () => {
    const agent = agents.find(a => a.matricule === pickerMatricule);
    if (!agent || newAgents.some(a => a.matricule === agent.matricule)) return;
    setNewAgents(prev => [...prev, { nom: agent.nom, matricule: agent.matricule, direction: agent.direction, type: DECISION_TYPE, debut: "", fin: "", duree: 0 }]);
    setPickerMatricule("");
  };

  const handleDownload = (d: typeof decisions[number]) => {
    downloadDecisionPdf(d);
  };

  if (!canManage) return <ConsultationDecisions />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 font-[family-name:var(--font-display)]">Gestion des décisions</h2>
          <p className="text-sm text-gray-500">{decisions.length} décisions générées</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setShowNew(true)}>Nouvelle décision</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* List */}
        <div className="lg:col-span-1 space-y-3">
          {decisions.length === 0 && (
            <Card padding="sm">
              <div className="py-8 text-center">
                <FileText size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">Aucune décision créée</p>
                <p className="text-xs text-gray-400 mt-1">Cliquez sur « Nouvelle décision » pour en créer une.</p>
              </div>
            </Card>
          )}
          {decisions.map(d => (
            <Card key={d.id} padding="sm" hover>
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{d.id}</span>
                <Badge variant={statutMap[d.statut].badge} size="sm">{statutMap[d.statut].label}</Badge>
              </div>
              <h4 className="text-xs font-semibold text-gray-800 mb-1 leading-snug">{d.titre}</h4>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                <span className="flex items-center gap-1"><Users size={10} />{d.agents.length} agent{d.agents.length > 1 ? "s" : ""}</span>
                <span>{d.dateCreation}</span>
                <span className="text-[#E8751A]">{d.type}</span>
              </div>
              <div className="flex gap-1.5 mt-3">
                <button onClick={() => setPreviewId(d.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#E8751A] transition-colors px-2 py-1 rounded-lg hover:bg-orange-50">
                  <Eye size={12} />Aperçu
                </button>
                {d.statut === "signed" && (
                  <button onClick={() => handleDownload(d)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-green-50">
                    <Download size={12} />Télécharger
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Editor / Preview */}
        <div className="lg:col-span-2">
          {preview ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Aperçu — {preview.id}</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Document administratif officiel</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => handleDownload(preview)}>PDF</Button>
                  {preview.statut !== "signed" && (
                    <Button size="sm" icon={<FileCheck size={14} />} onClick={() => signDecision(preview.id)}>Signer & publier</Button>
                  )}
                </div>
              </CardHeader>
              {/* Document */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="bg-white shadow-sm rounded-xl p-8 max-w-2xl mx-auto font-[family-name:var(--font-sans)]">
                  <div className="border-b-2 border-[#E8751A] pb-4 mb-6 flex justify-between items-start">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-[#E8751A] flex items-center justify-center mb-2">
                        <span className="text-white font-bold text-sm">CI</span>
                      </div>
                      <p className="text-xs font-bold">MINISTÈRE DE LA</p>
                      <p className="text-xs font-bold text-[#E8751A]">FONCTION PUBLIQUE</p>
                      <p className="text-xs text-gray-500">Direction des Ressources Humaines</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p className="font-bold text-gray-800">RÉPUBLIQUE DE CÔTE D'IVOIRE</p>
                      <p className="italic">Union — Discipline — Travail</p>
                      <p className="mt-2">Abidjan, le {new Date().toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <p className="text-xs text-gray-400">N° {preview.id}/MFP/DRH/GCPE</p>
                    <h3 className="text-sm font-bold uppercase tracking-widest mt-1">DÉCISION</h3>
                    <p className="text-xs text-gray-500 mt-1">{preview.titre}</p>
                  </div>
                  <div className="text-xs text-gray-700 space-y-3 leading-relaxed">
                    <p className="italic text-gray-500">Le Ministre de la Fonction Publique,</p>
                    <p>Vu la Constitution de la République de Côte d'Ivoire du 08 novembre 2016 ;</p>
                    <p>Vu la loi n°92-570 du 11 Septembre 1992 portant Statut Général de la Fonction Publique ;</p>
                    <p className="font-semibold">DÉCIDE :</p>
                    <p><strong>ARTICLE 1er :</strong> Des congés/permissions sont accordés aux fonctionnaires désignés en annexe de la présente décision.</p>
                    <p><strong>ARTICLE 2 :</strong> La présente décision prend effet à compter de la date de sa signature et sera enregistrée partout où besoin sera.</p>
                  </div>
                  <div className="mt-8">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold">Agent</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold">Matricule</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold">Du</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold">Au</th>
                          <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold">Durée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.agents.map((a, i) => (
                          <tr key={i}>
                            <td className="border border-gray-200 px-2 py-1.5">{a.nom}</td>
                            <td className="border border-gray-200 px-2 py-1.5 font-mono">{a.matricule}</td>
                            <td className="border border-gray-200 px-2 py-1.5">{a.debut || "—"}</td>
                            <td className="border border-gray-200 px-2 py-1.5">{a.fin || "—"}</td>
                            <td className="border border-gray-200 px-2 py-1.5 text-center font-bold">{a.duree ? `${a.duree}j` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Le Ministre de la Fonction Publique</p>
                      <div className="w-28 h-20 border-b border-gray-300 mx-auto" />
                      <p className="text-xs font-bold mt-1">NOM PRÉNOM</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center h-64">
              <FileText size={40} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Sélectionnez une décision pour l'aperçu</p>
            </Card>
          )}
        </div>
      </div>

      {/* New Decision Modal */}
      <Modal
        open={showNew}
        onClose={resetModal}
        title="Créer une nouvelle décision"
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={resetModal}>Annuler</Button>
            <Button size="sm" icon={<FileCheck size={14} />} onClick={handleCreate} disabled={!newTitre || newAgents.length === 0}>Créer la décision</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Titre de la décision" required placeholder="Ex: Décision collective de congés annuels — Janvier 2025" value={newTitre} onChange={e => setNewTitre(e.target.value)} />
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 text-xs text-gray-600">
            <span className="font-semibold text-[#E8751A]">Type de congé :</span> {DECISION_TYPE} — la décision de congé ne concerne que les congés annuels.
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Agents concernés</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50"><th className="text-left px-4 py-2 font-medium text-gray-500">Agent</th><th className="text-left px-4 py-2 font-medium text-gray-500">Direction</th><th className="px-4 py-2"></th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {newAgents.map((a, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{a.nom}<span className="text-gray-400 ml-2 font-mono">{a.matricule}</span></td>
                      <td className="px-4 py-2.5 text-gray-500">{a.direction}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => setNewAgents(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-1 rounded"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                  {newAgents.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-3 text-center text-gray-400">Aucun agent ajouté</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <select value={pickerMatricule} onChange={e => setPickerMatricule(e.target.value)} className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white form-input">
                <option value="">Sélectionner un agent...</option>
                {agents.filter(a => !newAgents.some(n => n.matricule === a.matricule) && hasOneYearService(a.dateEmbauche)).map(a => (
                  <option key={a.id} value={a.matricule}>{a.nom} — {a.matricule}</option>
                ))}
              </select>
              <button onClick={addAgentToNew} disabled={!pickerMatricule} className="text-xs text-[#E8751A] flex items-center gap-1 font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed">
                <Plus size={12} />Ajouter
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Seuls les agents ayant au moins 1 an de service sont éligibles à une décision de congé.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
