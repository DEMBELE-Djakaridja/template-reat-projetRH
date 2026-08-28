import { useState, useEffect } from "react";
import Card, { CardHeader, CardTitle } from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Input, { Select, Textarea } from "../../components/UI/Input";
import { useApp, STORAGE_PREFIX } from "../../context/AppContext";
import { CheckCircle, Upload, ArrowLeft, ArrowRight, Send, FileText } from "lucide-react";

const STEPS = ["Informations", "Période", "Motif & pièces jointes", "Aperçu & soumission"];

const typesConge = [
  { value: "annuel", label: "Congé annuel" },
  { value: "maladie", label: "Congé maladie" },
  { value: "maternite", label: "Congé maternité" },
  { value: "paternite", label: "Congé paternité" },
  { value: "exceptionnel", label: "Congé exceptionnel" },
  { value: "sans-solde", label: "Congé sans solde" },
];

const SOLDE_ANNUEL = 30;

const PIECES_REQUISES: Record<string, string> = {
  maladie: "Pour un congé maladie : certificat médical obligatoire",
  maternite: "Pour un congé maternité : certificat de grossesse et carnet de maternité obligatoires",
  paternite: "Pour un congé paternité : acte de naissance de l'enfant obligatoire",
};

const FORM_DEFAULT = { type: "", debut: "", fin: "", duree: "", motif: "", adresseConge: "", dateAccouchement: "" };

interface Draft { step: number; form: typeof FORM_DEFAULT; fichiers: string[] }

function draftKey(matricule?: string) {
  return matricule ? `${STORAGE_PREFIX}draft-conge:${matricule}` : null;
}

function loadDraft(matricule?: string): Draft | null {
  const key = draftKey(matricule);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export default function NouvelleDemandeConge() {
  const { currentUser, setCurrentPage, addConge, agents } = useApp();
  const draft = loadDraft(currentUser?.matricule);
  const [step, setStep] = useState(draft?.step ?? 0);
  const [form, setForm] = useState(draft?.form ?? FORM_DEFAULT);
  const [fichiers, setFichiers] = useState<string[]>(draft?.fichiers ?? []);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");

  const clearDraft = () => {
    const key = draftKey(currentUser?.matricule);
    if (key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
  };

  useEffect(() => {
    const key = draftKey(currentUser?.matricule);
    if (!key || submitted) return;
    try {
      localStorage.setItem(key, JSON.stringify({ step, form, fichiers }));
    } catch {
      // storage unavailable — draft simply won't persist across reloads
    }
  }, [step, form, fichiers, currentUser?.matricule, submitted]);

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const calcDuree = (debut: string, fin: string) => {
    if (debut && fin) {
      const d1 = new Date(debut), d2 = new Date(fin);
      const diff = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1);
      update("duree", String(diff));
    }
  };

  const addDaysIso = (iso: string, days: number) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const MATERNITE_SEMAINES_AVANT = 8;
  const MATERNITE_SEMAINES_APRES = 12;

  const updateDateAccouchement = (dateAccouchement: string) => {
    if (!dateAccouchement) {
      setForm(prev => ({ ...prev, dateAccouchement: "", debut: "", fin: "", duree: "" }));
      return;
    }
    const debut = addDaysIso(dateAccouchement, -MATERNITE_SEMAINES_AVANT * 7);
    const fin = addDaysIso(dateAccouchement, MATERNITE_SEMAINES_APRES * 7);
    const duree = (MATERNITE_SEMAINES_AVANT + MATERNITE_SEMAINES_APRES) * 7;
    setForm(prev => ({ ...prev, dateAccouchement, debut, fin, duree: String(duree) }));
  };

  const updateDebutPaternite = (debut: string) => {
    if (!debut) {
      setForm(prev => ({ ...prev, debut: "", fin: "", duree: "" }));
      return;
    }
    const d1 = new Date(debut);
    const d2 = new Date(debut);
    d2.setMonth(d2.getMonth() + 1);
    d2.setDate(d2.getDate() - 1);
    const fin = d2.toISOString().slice(0, 10);
    const duree = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
    setForm(prev => ({ ...prev, debut, fin, duree: String(duree) }));
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const typeLabel = typesConge.find(t => t.value === form.type)?.label ?? form.type;

  const agentRecord = agents.find(a => a.matricule === currentUser?.matricule);
  const soldePris = agentRecord?.pris ?? 0;
  const dureeDemandee = form.type === "annuel" ? (Number(form.duree) || 0) : 0;
  const soldeRestant = SOLDE_ANNUEL - soldePris - dureeDemandee;
  const soldeInsuffisant = form.type === "annuel" && dureeDemandee > 0 && soldeRestant < 0;

  const handleSubmit = () => {
    if (!currentUser) return;
    const record = addConge({
      agent: `${currentUser.prenom} ${currentUser.nom}`,
      matricule: currentUser.matricule,
      direction: currentUser.direction,
      type: typeLabel,
      debut: formatDate(form.debut),
      fin: formatDate(form.fin),
      duree: Number(form.duree) || 0,
      motif: form.motif,
      fichiers,
    });
    setReference(record.id);
    setSubmitted(true);
    clearDraft();
  };

  const handleBack = () => {
    if (step > 0) { setStep(step - 1); return; }
    clearDraft();
    setCurrentPage("conge-liste");
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-80">
        <Card className="max-w-md w-full text-center p-10">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)] mb-2">Demande soumise !</h2>
          <p className="text-sm text-gray-500 mb-2">Votre demande a été enregistrée avec succès.</p>
          <div className="bg-orange-50 rounded-xl p-3 mb-5">
            <p className="text-xs text-gray-600">Référence : <strong className="text-[#E8751A] font-mono">{reference}</strong></p>
          </div>
          <p className="text-xs text-gray-400 mb-6">Vous recevrez une notification dès que votre demande sera traitée par la DRH.</p>
          <Button onClick={() => setCurrentPage("conge-liste")} className="w-full">
            Voir mes demandes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Step indicator */}
      <Card padding="sm">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 flex-1 ${i <= step ? "" : "opacity-40"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                  ${i < step ? "bg-green-500 text-white" : i === step ? "bg-[#E8751A] text-white" : "bg-gray-100 text-gray-400"}`}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-gray-800" : "text-gray-400"}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 rounded-full ${i < step ? "bg-[#E8751A]" : "bg-gray-100"}`} />}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{STEPS[step]}</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Étape {step + 1} sur {STEPS.length}</p>
          </div>
        </CardHeader>

        {step === 0 && (
          <div className="space-y-5">
            {/* Agent info (readonly) */}
            <div className="bg-white rounded-xl p-4 border border-[#E8751A]">
              <p className="text-xs font-semibold text-[#E8751A] mb-3 uppercase tracking-wide">Informations de l'agent</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Nom complet", val: `${currentUser?.prenom} ${currentUser?.nom}` },
                  { label: "Matricule", val: currentUser?.matricule },
                  { label: "Direction", val: currentUser?.direction },
                  { label: "Emploi", val: currentUser?.service },
                ].map(f => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">{f.label}</label>
                    <div className="w-full border border-gray-200 rounded-lg bg-white text-sm text-gray-800 px-3.5 py-2.5">{f.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <Select
              label="Type de congé"
              required
              options={typesConge}
              placeholder="Sélectionner le type de congé"
              value={form.type}
              onChange={e => update("type", e.target.value)}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            {form.type === "maternite" ? (
              <>
                <Input label="Date prévue d'accouchement" type="date" required value={form.dateAccouchement}
                  onChange={e => updateDateAccouchement(e.target.value)}
                  hint={`Congé de maternité : ${MATERNITE_SEMAINES_AVANT} semaines avant et ${MATERNITE_SEMAINES_APRES} semaines après la date prévue (${MATERNITE_SEMAINES_AVANT + MATERNITE_SEMAINES_APRES} semaines au total)`} />
                {form.debut && form.fin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-0.5">Début du congé</p>
                      <p className="text-sm font-semibold text-gray-800">{new Date(form.debut).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-0.5">Fin du congé</p>
                      <p className="text-sm font-semibold text-gray-800">{new Date(form.fin).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                )}
              </>
            ) : form.type === "paternite" ? (
              <>
                <Input label="Date de début du congé" type="date" required value={form.debut}
                  onChange={e => updateDebutPaternite(e.target.value)}
                  hint="Congé de paternité : 1 mois à compter de la date de début" />
                {form.fin && (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5">Fin du congé</p>
                    <p className="text-sm font-semibold text-gray-800">{new Date(form.fin).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date de début" type="date" required value={form.debut}
                  onChange={e => { update("debut", e.target.value); calcDuree(e.target.value, form.fin); }} />
                <Input label="Date de fin" type="date" required value={form.fin}
                  onChange={e => { update("fin", e.target.value); calcDuree(form.debut, e.target.value); }} />
              </div>
            )}
            {form.duree && (
              <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-3 border border-orange-100">
                <div className="w-10 h-10 rounded-xl bg-[#E8751A] flex items-center justify-center text-white font-bold text-lg font-[family-name:var(--font-display)]">
                  {form.duree}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Durée calculée : <strong className="text-[#E8751A]">{form.duree} jours</strong></p>
                  <p className="text-xs text-gray-500">Jours calendaires (hors jours fériés non comptabilisés)</p>
                </div>
              </div>
            )}
            <Input label="Adresse pendant le congé" value={form.adresseConge} onChange={e => update("adresseConge", e.target.value)}
              hint="Où pouvons-nous vous joindre en cas de besoin ?" />

            {/* Solde */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-3">Solde de congés annuel disponible</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Acquis", val: SOLDE_ANNUEL },
                  { label: "Pris", val: soldePris },
                  { label: "Restant", val: soldeRestant },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className={`text-2xl font-bold font-[family-name:var(--font-display)] ${s.label === "Restant" && soldeInsuffisant ? "text-red-600" : "text-gray-800"}`}>{s.val}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
              {form.type === "annuel" && dureeDemandee > 0 && (
                <p className={`text-xs mt-3 ${soldeInsuffisant ? "text-red-600 font-medium" : "text-gray-500"}`}>
                  {soldeInsuffisant
                    ? `Solde insuffisant : cette demande de ${dureeDemandee} jour(s) dépasse votre solde restant.`
                    : `Après cette demande de ${dureeDemandee} jour(s), il vous restera ${soldeRestant} jour(s).`}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Textarea label="Motif de la demande" required value={form.motif} onChange={e => update("motif", e.target.value)}
              placeholder="Décrivez le motif de votre demande de congé..." rows={4} />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Pièces jointes</label>
              <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#E8751A] hover:bg-orange-50 transition-all cursor-pointer block">
                <input type="file" multiple className="hidden" onChange={e => setFichiers(Array.from(e.target.files ?? []).map(f => f.name))} />
                <Upload size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Glissez vos fichiers ici ou <span className="text-[#E8751A] font-medium">cliquez pour parcourir</span></p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — Max 5MB par fichier</p>
              </label>
              {fichiers.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {fichiers.map(f => <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5"><FileText size={12} className="text-[#E8751A]" />{f}</li>)}
                </ul>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {PIECES_REQUISES[form.type] ?? "Joignez tout document justifiant votre demande de congé"}
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Agent", val: `${currentUser?.prenom} ${currentUser?.nom}` },
                { label: "Matricule", val: currentUser?.matricule ?? "" },
                { label: "Type de congé", val: typesConge.find(t => t.value === form.type)?.label ?? "Non sélectionné" },
                { label: "Du", val: form.debut || "Non renseigné" },
                { label: "Au", val: form.fin || "Non renseigné" },
                { label: "Durée", val: form.duree ? `${form.duree} jours` : "Non calculée" },
              ].map(f => (
                <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{f.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{f.val}</p>
                </div>
              ))}
            </div>
            {form.motif && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Motif</p>
                <p className="text-sm text-gray-700">{form.motif}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-7 pt-5 border-t border-gray-100">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={handleBack}>
            {step === 0 ? "Annuler" : "Précédent"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" icon={<ArrowRight size={14} />} onClick={() => setStep(step + 1)}>
              Suivant
            </Button>
          ) : (
            <Button size="sm" icon={<Send size={14} />} onClick={handleSubmit}>
              Soumettre la demande
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
