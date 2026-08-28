import { useState, useRef } from "react";
import Card from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import { Textarea } from "../../components/UI/Input";
import { Eye, Download, Stamp, CheckCircle, FileCheck, Send, Eraser, ArrowLeft, Calendar, Clock, MessageSquare } from "lucide-react";
import { useApp, type UserRole, type Acte, type ActeStatut, type User } from "../../context/AppContext";
import { downloadActePdf } from "../../lib/pdf";

const PAGE_ROLES: UserRole[] = ["admin", "directeur", "sous-directeur-drh", "gestionnaire-drh", "verificateur-rh"];

const STAGE_CONFIG: Record<ActeStatut, { label: string; badge: any }> = {
  attente_production: { label: "En attente", badge: "pending" },
  attente_verification: { label: "En attente", badge: "pending" },
  attente_transmission: { label: "En attente", badge: "pending" },
  attente_validation_sddrh: { label: "En attente", badge: "pending" },
  attente_signature: { label: "En attente", badge: "pending" },
  signe: { label: "Signé", badge: "success" },
};

function canActNow(acte: Acte, user: User | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return acte.statut !== "signe";
  switch (acte.statut) {
    case "attente_production": return user.role === "gestionnaire-drh" && user.matricule === acte.gestionnaireDrhMatricule;
    case "attente_verification": return user.role === "verificateur-rh";
    case "attente_transmission": return user.role === "gestionnaire-drh" && user.matricule === acte.gestionnaireDrhMatricule;
    case "attente_validation_sddrh": return user.role === "sous-directeur-drh" && user.matricule === acte.sousDirecteurDrhMatricule;
    case "attente_signature": return user.role === "directeur";
    default: return false;
  }
}

function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(canvasRef.current!.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1.5">Apposer votre signature</p>
      <canvas
        ref={canvasRef}
        width={400}
        height={140}
        className="border border-gray-200 rounded-lg bg-white w-full touch-none cursor-crosshair"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 mt-1.5">
        <Eraser size={12} />Effacer
      </button>
    </div>
  );
}

function ActeDocument({ acte, previewSignature }: { acte: Acte; previewSignature?: string | null }) {
  const signature = previewSignature ?? acte.signatureDataUrl;
  return (
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
            <p className="mt-2">Abidjan, le {acte.dateSignature ?? acte.dateCreation}</p>
          </div>
        </div>
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400">Réf. demande n° {acte.congeId} · Acte n° {acte.id}</p>
          <h3 className="text-sm font-bold uppercase tracking-widest mt-1">Acte de cessation d'activité</h3>
        </div>
        <div className="text-xs text-gray-700 space-y-3 leading-relaxed">
          <p className="italic text-gray-500">Le Gestionnaire de la Direction des Ressources Humaines,</p>
          <p>Vu la loi n°92-570 du 11 Septembre 1992 portant Statut Général de la Fonction Publique ;</p>
          <p>Vu la demande de congé n° {acte.congeId} validée par les autorités compétentes ;</p>
          <p className="font-semibold">CERTIFIE :</p>
          <p><strong>ARTICLE 1er :</strong> L'agent {acte.agent}, matricule {acte.matricule}, affecté à la {acte.direction}, cesse d'exercer ses fonctions à compter du {acte.debut} jusqu'au {acte.fin} inclus, dans le cadre d'un(e) {acte.type}, soit une durée de {acte.duree} jour{acte.duree > 1 ? "s" : ""}.</p>
          <p><strong>ARTICLE 2 :</strong> Le présent acte est établi et enregistré conformément à la demande de congé susvisée.</p>
        </div>
        <div className="mt-8 flex justify-end">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Le Directeur</p>
            {signature ? (
              <img src={signature} alt="Signature du DRH" className="w-28 h-20 object-contain mx-auto" />
            ) : (
              <div className="w-28 h-20 border-b border-gray-300 mx-auto" />
            )}
            <p className="text-xs font-bold mt-1">{acte.statut === "signe" ? "Signé" : "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductionActes() {
  const {
    currentUser, actes, conges,
    produireActe, deciderVerificationActe, transmettreActe, deciderValidationSDDRH, signerActe,
  } = useApp();
  const canView = !!currentUser && PAGE_ROLES.includes(currentUser.role);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [showDocument, setShowDocument] = useState(false);
  const [comment, setComment] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; kind: "verification" | "validation" } | null>(null);

  const detail = detailId ? actes.find(a => a.id === detailId) ?? null : null;
  const detailConge = detail ? conges.find(c => c.id === detail.congeId) : undefined;
  const rejectMotifMissing = !comment.trim();

  const closeDetail = () => { setDetailId(null); setShowDocument(false); setSignatureDataUrl(null); };
  const openDetail = (id: string) => { setDetailId(id); setShowDocument(false); setSignatureDataUrl(null); };

  const handleProduire = () => { if (!detail) return; produireActe(detail.id); closeDetail(); };
  const handleTransmettre = () => { if (!detail) return; transmettreActe(detail.id); closeDetail(); };
  const handleSigner = () => { if (!detail || !signatureDataUrl) return; signerActe(detail.id, signatureDataUrl); closeDetail(); };

  const handleVerificationApprove = () => { if (!detail) return; deciderVerificationActe(detail.id, "approve"); closeDetail(); };
  const handleValidationSDDRHApprove = () => { if (!detail) return; deciderValidationSDDRH(detail.id, "approve"); closeDetail(); };

  const openReject = (kind: "verification" | "validation") => {
    if (!detail) return;
    setRejectTarget({ id: detail.id, kind });
    setComment("");
    closeDetail();
  };

  const closeReject = () => { setRejectTarget(null); setComment(""); };

  const confirmReject = () => {
    if (!rejectTarget || rejectMotifMissing) return;
    if (rejectTarget.kind === "verification") deciderVerificationActe(rejectTarget.id, "reject", comment);
    else deciderValidationSDDRH(rejectTarget.id, "reject", comment);
    closeReject();
  };

  if (!canView) {
    return (
      <Card>
        <div className="py-10 text-center">
          <Stamp size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">Vous n'avez pas accès à la production d'actes.</p>
        </div>
      </Card>
    );
  }

  if (detail) {
    const footerAction = (() => {
      switch (detail.statut) {
        case "attente_production":
          return showDocument
            ? <Button variant="primary" size="sm" icon={<CheckCircle size={14} />} onClick={handleProduire}>Valider le document</Button>
            : <Button variant="primary" size="sm" icon={<FileCheck size={14} />} onClick={() => setShowDocument(true)}>Générer le document</Button>;
        case "attente_verification":
          return (
            <>
              <Button variant="danger" size="sm" onClick={() => openReject("verification")}>Rejeter</Button>
              <Button variant="primary" size="sm" icon={<CheckCircle size={14} />} onClick={handleVerificationApprove}>Valider</Button>
            </>
          );
        case "attente_transmission":
          return <Button variant="primary" size="sm" icon={<Send size={14} />} onClick={handleTransmettre}>Transmettre au Sous-Directeur DRH</Button>;
        case "attente_validation_sddrh":
          return (
            <>
              <Button variant="danger" size="sm" onClick={() => openReject("validation")}>Rejeter</Button>
              <Button variant="primary" size="sm" icon={<CheckCircle size={14} />} onClick={handleValidationSDDRHApprove}>Valider</Button>
            </>
          );
        case "attente_signature":
          return <Button variant="primary" size="sm" icon={<Stamp size={14} />} onClick={handleSigner} disabled={!signatureDataUrl}>Signer l'acte</Button>;
        default:
          return null;
      }
    })();

    return (
      <div className="space-y-5">
        <button onClick={closeDetail} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#E8751A] transition-colors">
          <ArrowLeft size={15} />Retour aux demandes
        </button>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{detail.agent[0]}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 font-[family-name:var(--font-display)]">{detail.agent}</h2>
              <p className="text-sm text-gray-500">{detail.matricule} — {detail.direction}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant={STAGE_CONFIG[detail.statut].badge} dot size="sm">{STAGE_CONFIG[detail.statut].label}</Badge>
                <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{detail.congeId}</span>
              </div>
            </div>
          </div>

          {(detail.statut === "attente_transmission" || (detail.statut === "attente_production" && !showDocument)) && (
            <>
              <div className="grid grid-cols-4 gap-4 mt-5">
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><FileCheck size={12} />Type</p><p className="font-semibold text-gray-800">{detail.type}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Calendar size={12} />Du</p><p className="font-semibold text-gray-800">{detail.debut}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Calendar size={12} />Au</p><p className="font-semibold text-gray-800">{detail.fin}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Clock size={12} />Durée</p><p className="font-semibold text-gray-800">{detail.duree} jour{detail.duree > 1 ? "s" : ""}</p></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mt-4">
                <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><MessageSquare size={12} />Motif de la demande</p>
                <p className="font-semibold text-gray-800">{detailConge?.motif || "—"}</p>
              </div>
            </>
          )}

          {detail.motifRejet && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mt-4">
              <p className="text-xs text-red-500 mb-1">Motif du dernier rejet</p>
              <p className="text-sm text-red-700">{detail.motifRejet}</p>
            </div>
          )}

          {(detail.statut === "attente_production" && showDocument) && <div className="mt-5"><ActeDocument acte={detail} /></div>}
          {(detail.statut === "attente_verification" || detail.statut === "attente_validation_sddrh" || detail.statut === "attente_signature" || detail.statut === "signe") && (
            <div className="mt-5"><ActeDocument acte={detail} previewSignature={signatureDataUrl} /></div>
          )}

          {detail.statut === "attente_signature" && canActNow(detail, currentUser) && (
            <div className="mt-5"><SignaturePad onChange={setSignatureDataUrl} /></div>
          )}

          {footerAction && (
            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
              <button onClick={closeDetail} className="text-sm text-gray-600 hover:text-gray-800 font-medium px-2">Fermer</button>
              {footerAction}
            </div>
          )}
        </Card>

        <Modal
          open={!!rejectTarget}
          onClose={closeReject}
          title="Confirmer le rejet"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={closeReject}>Annuler</Button>
              <Button variant="danger" size="sm" onClick={confirmReject} disabled={rejectMotifMissing}>Rejeter</Button>
            </>
          }
        >
          <Textarea label="Motif du rejet *" value={comment} onChange={e => setComment(e.target.value)} placeholder="Expliquez le motif du rejet..." />
          {rejectMotifMissing && <p className="text-xs text-red-600 mt-1.5">Le motif du rejet est obligatoire.</p>}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800 font-[family-name:var(--font-display)]">Production d'actes</h2>
        <p className="text-sm text-gray-500">Circuit : DRH → Sous-Directeur DRH → Gestionnaire DRH → Vérificateur RH → Sous-Directeur DRH → Directeur</p>
      </div>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-800 font-[family-name:var(--font-display)]">Actes de cessation</h3>
          <p className="text-xs text-gray-500">{actes.length} acte{actes.length > 1 ? "s" : ""}</p>
        </div>
        {actes.length === 0 ? (
          <div className="py-16 text-center">
            <FileCheck size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Aucun acte pour le moment</p>
            <p className="text-xs text-gray-400 mt-1">Un acte est créé automatiquement lorsque le Sous-Directeur DRH impute une demande au Gestionnaire DRH.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Référence", "Agent", "Demande liée", "Étape actuelle", "Action"].map(h => (
                    <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-3 first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {actes.map(a => (
                  <tr key={a.id} className="table-row">
                    <td className="px-4 py-3.5 pl-6"><span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{a.id}</span></td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-800">{a.agent}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-600 font-mono">{a.congeId}</td>
                    <td className="px-4 py-3.5"><Badge variant={STAGE_CONFIG[a.statut].badge} dot size="sm">{STAGE_CONFIG[a.statut].label}</Badge></td>
                    <td className="px-4 py-3.5 pr-6">
                      {a.statut === "signe" ? (
                        <button onClick={() => downloadActePdf(a)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#E8751A] font-medium transition-colors">
                          <Download size={13} />Télécharger
                        </button>
                      ) : canActNow(a, currentUser) ? (
                        <button onClick={() => openDetail(a.id)} className="flex items-center gap-1.5 text-xs text-[#E8751A] font-medium hover:underline">
                          <Eye size={13} />Consulter
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
