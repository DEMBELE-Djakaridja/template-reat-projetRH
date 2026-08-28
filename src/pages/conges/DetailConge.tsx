import Card, { CardHeader, CardTitle } from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import Button from "../../components/UI/Button";
import { ArrowLeft, FileText, Download, CheckCircle, XCircle, Clock, Calendar, MessageSquare, Printer } from "lucide-react";
import { useApp, type CongeRequest } from "../../context/AppContext";
import { downloadTextFile } from "../../lib/csv";

interface Props { demande: CongeRequest; onBack: () => void; }

const statutMap: Record<string, { badge: any; label: string }> = {
  pending: { badge: "pending", label: "En attente" },
  success: { badge: "success", label: "Validée" },
  warning: { badge: "warning", label: "En cours" },
  danger: { badge: "danger", label: "Rejetée" },
  info: { badge: "info", label: "En cours" },
};

export default function DetailConge({ demande, onBack }: Props) {
  const { decideConge } = useApp();

  const workflowSteps = [
    { step: "Soumise", date: demande.soumis, done: true, actor: demande.agent, role: "Agent" },
    { step: "Validée", date: demande.soumis, done: true, actor: "Système", role: "Vérificateur" },
    { step: "En traitement", date: demande.soumis, done: demande.statut !== "pending", actor: "DRH", role: "DRH" },
    { step: "Validée", date: demande.statut === "success" ? demande.soumis : "—", done: demande.statut === "success", actor: demande.statut === "success" ? "Directeur" : "—", role: "Directeur" },
    { step: "Rejetée", date: demande.statut === "danger" ? demande.soumis : "—", done: demande.statut === "danger", actor: demande.statut === "danger" ? "Directeur" : "—", role: "Directeur" },
  ];
  const currentStep = workflowSteps.filter(s => s.done).length;

  const documentText = () => `DÉCISION DE CONGÉ — Réf. ${demande.id}\n\nAgent : ${demande.agent} (${demande.matricule})\nDirection : ${demande.direction}\nType : ${demande.type}\nPériode : du ${demande.debut} au ${demande.fin} (${demande.duree} jours)\nMotif : ${demande.motif}\nStatut : ${statutMap[demande.statut]?.label ?? demande.statut}\n`;

  const handlePrint = () => window.print();
  const handleDownload = () => downloadTextFile(`${demande.id}.txt`, documentText());
  const canDecide = demande.statut === "pending" || demande.statut === "warning" || demande.statut === "info";

  const handleValider = () => { decideConge([demande.id], "approve"); onBack(); };
  const handleRejeter = () => {
    let motif = window.prompt("Motif du rejet (obligatoire) :", "");
    while (motif !== null && !motif.trim()) {
      motif = window.prompt("Le motif du rejet est obligatoire. Motif du rejet :", "");
    }
    if (motif === null) return;
    decideConge([demande.id], "reject", motif.trim());
    onBack();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#E8751A] transition-colors font-medium">
          <ArrowLeft size={16} /> Retour à la liste
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={handlePrint}>Imprimer</Button>
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleDownload}>Télécharger</Button>
          {canDecide && (
            <>
              <Button variant="danger" size="sm" icon={<XCircle size={14} />} onClick={handleRejeter}>Rejeter</Button>
              <Button size="sm" icon={<CheckCircle size={14} />} onClick={handleValider}>Valider</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <Card>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center shadow-sm">
                  <span className="text-white text-xl font-bold">{demande.agent.split(" ")[0][0]}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)]">{demande.agent}</h2>
                  <p className="text-sm text-gray-500">{demande.matricule} — {demande.direction}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={statutMap[demande.statut]?.badge} dot>{statutMap[demande.statut]?.label}</Badge>
                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{demande.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <FileText size={14} />, label: "Type", value: demande.type },
                { icon: <Calendar size={14} />, label: "Du", value: demande.debut },
                { icon: <Calendar size={14} />, label: "Au", value: demande.fin },
                { icon: <Clock size={14} />, label: "Durée", value: `${demande.duree} jours` },
              ].map(f => (
                <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">{f.icon}<span className="text-xs">{f.label}</span></div>
                  <p className="text-sm font-semibold text-gray-800">{f.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5"><MessageSquare size={12} />Motif de la demande</p>
              <p className="text-sm text-gray-700">{demande.motif}</p>
            </div>
            {demande.motifRejet && (
              <div className="mt-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs font-medium text-red-500 mb-1.5">Motif du rejet</p>
                <p className="text-sm text-red-700">{demande.motifRejet}</p>
              </div>
            )}
          </Card>

          {/* Document preview */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu de la décision</CardTitle>
              <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleDownload}>PDF</Button>
            </CardHeader>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 font-[family-name:var(--font-sans)]">
              <div className="max-w-lg mx-auto bg-white shadow-sm rounded-xl p-8 border border-gray-100">
                {/* Letterhead */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#E8751A]">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-[#E8751A] flex items-center justify-center mb-2">
                      <span className="text-white font-bold text-sm">CI</span>
                    </div>
                    <p className="text-xs font-bold text-gray-800 leading-tight">MINISTÈRE DE LA</p>
                    <p className="text-xs font-bold text-[#E8751A] leading-tight">FONCTION PUBLIQUE</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">République de Côte d'Ivoire</p>
                    <p className="text-xs text-gray-400 italic">Union — Discipline — Travail</p>
                  </div>
                </div>
                <div className="text-center mb-6">
                  <p className="text-xs text-gray-500 mb-1">Réf. {demande.id}</p>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">DÉCISION DE CONGÉ</h3>
                  <p className="text-xs text-gray-500 mt-1">N° {demande.id.replace("DC", "DEC")}/MFP/DRH/2024</p>
                </div>
                <div className="text-xs text-gray-700 leading-relaxed space-y-3">
                  <p>Vu la loi n°92-570 du 11 Septembre 1992 portant Statut Général de la Fonction Publique...</p>
                  <p><strong>ARTICLE 1er :</strong> Un congé est accordé à M/Mme <strong>{demande.agent}</strong>, immatriculé(e) sous le numéro <strong>{demande.matricule}</strong>, affecté(e) à la <strong>{demande.direction}</strong>.</p>
                  <p><strong>ARTICLE 2 :</strong> Ce congé de <strong>{demande.type}</strong> est accordé du <strong>{demande.debut}</strong> au <strong>{demande.fin}</strong>, soit une durée de <strong>{demande.duree} jours</strong>.</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Abidjan, le {new Date().toLocaleDateString("fr-FR")}</p>
                    <p className="text-xs font-bold text-gray-700 mt-3">Le Ministre</p>
                    <div className="w-24 h-16 border-b border-gray-300 mt-2 mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Workflow */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow de validation</CardTitle>
              <span className="text-xs text-gray-400">{currentStep}/{workflowSteps.length}</span>
            </CardHeader>
            <div className="space-y-0">
              {workflowSteps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm
                      ${step.done ? "bg-[#E8751A] text-white" : i === currentStep ? "bg-white border-2 border-[#E8751A]" : "bg-gray-100 text-gray-400"}`}>
                      {step.done ? <CheckCircle size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </div>
                    {i < workflowSteps.length - 1 && (
                      <div className={`w-0.5 h-8 ${step.done ? "bg-[#E8751A]" : "bg-gray-100"}`} />
                    )}
                  </div>
                  <div className="pb-3 flex-1">
                    <p className={`text-xs font-semibold ${step.done ? "text-gray-800" : "text-gray-400"}`}>{step.step}</p>
                    <p className="text-xs text-gray-400">{step.actor}</p>
                    {step.date !== "—" && <p className="text-xs text-gray-400">{step.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pièces jointes */}
          <Card>
            <CardTitle className="mb-4">Pièces jointes</CardTitle>
            {demande.fichiers && demande.fichiers.length > 0 ? (
              <div className="space-y-2">
                {demande.fichiers.map(f => (
                  <div key={f} onClick={handleDownload} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg hover:bg-orange-50 cursor-pointer group transition-colors">
                    <FileText size={14} className="text-[#E8751A]" />
                    <span className="text-xs text-gray-700 flex-1">{f}</span>
                    <Download size={12} className="text-gray-400 group-hover:text-[#E8751A]" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Aucune pièce jointe fournie.</p>
            )}
          </Card>

          {/* Action */}
          {canDecide && (
            <Card>
              <CardTitle className="mb-4">Action rapide</CardTitle>
              <div className="space-y-2">
                <Button className="w-full" size="sm" icon={<CheckCircle size={14} />} onClick={handleValider}>
                  Valider la demande
                </Button>
                <Button variant="danger" className="w-full" size="sm" icon={<XCircle size={14} />} onClick={handleRejeter}>
                  Rejeter la demande
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
