import { useState } from "react";
import Card, { CardHeader, CardTitle } from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import { useApp, roleLabel } from "../../context/AppContext";
import { Camera, Bell, Shield, Save, CheckCircle, AlertCircle } from "lucide-react";

export default function MonCompte() {
  const { currentUser, setCurrentUser } = useApp();
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({ email: true, sms: false, app: true });
  const [profile, setProfile] = useState({
    prenom: currentUser?.prenom ?? "", nom: currentUser?.nom ?? "", email: currentUser?.email ?? "",
    telephone: "", direction: currentUser?.direction ?? "", service: currentUser?.service ?? "",
  });
  const [avatar, setAvatar] = useState<string | undefined>(currentUser?.avatar);
  const [pwd, setPwd] = useState({ actuel: "", nouveau: "", confirmation: "" });
  const [pwdError, setPwdError] = useState("");

  const handleSave = () => {
    if (currentUser) setCurrentUser({ ...currentUser, ...profile, avatar });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = () => {
    setPwdError("");
    if (!pwd.actuel || !pwd.nouveau || !pwd.confirmation) { setPwdError("Tous les champs sont requis."); return; }
    if (pwd.nouveau.length < 8) { setPwdError("Le nouveau mot de passe doit contenir au moins 8 caractères."); return; }
    if (pwd.nouveau !== pwd.confirmation) { setPwdError("La confirmation ne correspond pas au nouveau mot de passe."); return; }
    setPwd({ actuel: "", nouveau: "", confirmation: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {saved && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle size={16} />Modifications enregistrées avec succès
        </div>
      )}

      {/* Profile card */}
      <Card>
        <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center shadow-md overflow-hidden">
              {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : (
                <span className="text-white text-2xl font-bold">{currentUser?.prenom[0]}{currentUser?.nom[0]}</span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <Camera size={12} className="text-gray-500" />
            </label>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)]">{currentUser?.prenom} {currentUser?.nom}</h3>
            <p className="text-sm text-gray-500">{currentUser ? roleLabel(currentUser.role) : ""} — {currentUser?.direction}</p>
            <p className="text-xs font-mono text-[#E8751A] mt-1">{currentUser?.matricule}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Prénom" value={profile.prenom} onChange={e => setProfile(p => ({ ...p, prenom: e.target.value }))} />
          <Input label="Nom" value={profile.nom} onChange={e => setProfile(p => ({ ...p, nom: e.target.value }))} />
          <Input label="Email" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
          <Input label="Téléphone" placeholder="+225 XX XX XX XX XX" value={profile.telephone} onChange={e => setProfile(p => ({ ...p, telephone: e.target.value }))} />
          <Input label="Direction" value={profile.direction} onChange={e => setProfile(p => ({ ...p, direction: e.target.value }))} />
          <Input label="Service" value={profile.service} onChange={e => setProfile(p => ({ ...p, service: e.target.value }))} />
        </div>
        <div className="flex justify-end mt-5">
          <Button icon={<Save size={14} />} onClick={handleSave}>Enregistrer</Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Bell size={16} className="text-[#E8751A]" /><CardTitle>Notifications</CardTitle></div>
        </CardHeader>
        <div className="space-y-4">
          {[
            { key: "email", label: "Notifications par email", desc: "Recevez les mises à jour par email" },
            { key: "sms", label: "Notifications par SMS", desc: "Recevez les alertes par SMS" },
            { key: "app", label: "Notifications dans l'application", desc: "Alertes en temps réel dans l'interface" },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">{n.label}</p>
                <p className="text-xs text-gray-500">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifs[n.key as keyof typeof notifs] ? "bg-[#E8751A]" : "bg-gray-200"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifs[n.key as keyof typeof notifs] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Shield size={16} className="text-[#E8751A]" /><CardTitle>Sécurité</CardTitle></div>
        </CardHeader>
        <div className="space-y-4">
          {pwdError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-xs">
              <AlertCircle size={14} />{pwdError}
            </div>
          )}
          <Input label="Mot de passe actuel" type="password" placeholder="••••••••" value={pwd.actuel} onChange={e => setPwd(p => ({ ...p, actuel: e.target.value }))} />
          <Input label="Nouveau mot de passe" type="password" placeholder="••••••••" value={pwd.nouveau} onChange={e => setPwd(p => ({ ...p, nouveau: e.target.value }))}
            hint="Minimum 8 caractères, une majuscule, un chiffre" />
          <Input label="Confirmer le nouveau mot de passe" type="password" placeholder="••••••••" value={pwd.confirmation} onChange={e => setPwd(p => ({ ...p, confirmation: e.target.value }))} />
          <div className="flex justify-end">
            <Button variant="outline" icon={<Shield size={14} />} onClick={handlePasswordChange}>Changer le mot de passe</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
