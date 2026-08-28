import { useState, useEffect } from "react";
import Card, { CardHeader, CardTitle } from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Input, { Select, Textarea } from "../../components/UI/Input";
import { useApp, STORAGE_PREFIX } from "../../context/AppContext";
import { CheckCircle, Send, FileText, Clock, ArrowLeft } from "lucide-react";

const typesPermission = [
  { value: "maladie_enfant", label: "Maladie d'un enfant" },
  { value: "demarches_admin", label: "Démarches administratives" },
  { value: "mariage", label: "Mariage (agent ou proche)" },
  { value: "deuil", label: "Décès d'un proche" },
  { value: "education", label: "Raisons scolaires/éducation" },
  { value: "autre", label: "Autre motif" },
];


function diffJours(debut: string, fin: string) {
  if (!debut || !fin) return 0;
  const d1 = new Date(debut);
  const d2 = new Date(fin);
  const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

const FORM_DEFAULT = { type: "", debut: "", fin: "", motif: "" };

function draftKey(matricule?: string) {
  return matricule ? `${STORAGE_PREFIX}draft-permission:${matricule}` : null;
}

function loadDraft(matricule?: string): typeof FORM_DEFAULT | null {
  const key = draftKey(matricule);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function NouvellePermission() {
  const { currentUser, setCurrentPage, addPermission } = useApp();
  const draft = loadDraft(currentUser?.matricule);
  const [form, setForm] = useState(draft ?? FORM_DEFAULT);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const clearDraft = () => {
    const key = draftKey(currentUser?.matricule);
    if (key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
  };

  useEffect(() => {
    const key = draftKey(currentUser?.matricule);
    if (!key || submitted) return;
    try {
      localStorage.setItem(key, JSON.stringify(form));
    } catch {
      // storage unavailable — draft simply won't persist across reloads
    }
  }, [form, currentUser?.matricule, submitted]);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const duree = diffJours(form.debut, form.fin);
  const perioMandatory = form.debut && form.fin && duree > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !perioMandatory) return;
    setLoading(true);
    setTimeout(() => {
      const record = addPermission({
        agent: `${currentUser.prenom} ${currentUser.nom}`,
        matricule: currentUser.matricule,
        direction: currentUser.direction,
        date: form.debut === form.fin ? formatDate(form.debut) : `${formatDate(form.debut)} → ${formatDate(form.fin)}`,
        motif: typesPermission.find(t => t.value === form.type)?.label ?? form.motif,
        duree: `${duree} jour${duree > 1 ? "s" : ""}`,
      });
      setReference(record.id);
      setLoading(false);
      setSubmitted(true);
      clearDraft();
    }, 900);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-80">
        <Card className="max-w-md w-full text-center p-10">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)] mb-2">Permission soumise !</h2>
          <div className="bg-orange-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-600">Référence : <strong className="text-[#E8751A] font-mono">{reference}</strong></p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-5">
            <div className="flex items-center gap-2 justify-center text-green-700">
              <FileText size={14} />
              <p className="text-xs font-medium">Un acte administratif sera généré après validation</p>
            </div>
          </div>
          <Button onClick={() => setCurrentPage("perm-liste")} className="w-full">Voir mes permissions</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Demande de permission</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Agent info */}
          <div className="bg-orange-50 rounded-xl p-4 border border-[#E8751A]">
            <p className="text-xs font-semibold text-[#E8751A] mb-3 uppercase tracking-wide">Informations de l'agent</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-gray-500">Nom complet</span><p className="font-semibold text-gray-800">{currentUser?.prenom} {currentUser?.nom}</p></div>
              <div><span className="text-xs text-gray-500">Matricule</span><p className="font-semibold text-gray-800 font-mono">{currentUser?.matricule}</p></div>
            </div>
          </div>

          <Select label="Motif de permission" required options={typesPermission} placeholder="Sélectionner un motif" value={form.type} onChange={e => update("type", e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Date de début" type="date" required value={form.debut} onChange={e => update("debut", e.target.value)} />
            <Input label="Date de fin" type="date" required value={form.fin} min={form.debut || undefined} onChange={e => update("fin", e.target.value)} />
          </div>

          {perioMandatory && (
            <div className="bg-orange-50 rounded-xl p-3 flex items-center gap-2 border border-orange-100">
              <Clock size={14} className="text-[#E8751A]" />
              <p className="text-xs text-gray-700">Durée calculée : <strong className="text-[#E8751A]">{duree} jour{duree > 1 ? "s" : ""}</strong></p>
            </div>
          )}


          <Textarea label="Description détaillée" required value={form.motif} onChange={e => update("motif", e.target.value)}
            placeholder="Décrivez précisément le motif de votre permission..." rows={3} />

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => { clearDraft(); setCurrentPage("perm-liste"); }} icon={<ArrowLeft size={14} />}>
              Annuler
            </Button>
            <Button type="submit" loading={loading} disabled={!perioMandatory} icon={<Send size={14} />}>
              Soumettre
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
