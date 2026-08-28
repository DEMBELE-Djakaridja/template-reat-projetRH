import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Eye, EyeOff, Lock, IdCard, AlertCircle, CheckCircle } from "lucide-react";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import Input from "../../components/UI/Input";
import logoMfp from "../../logo-mfp.png";

export default function Login() {
  const { setCurrentUser, users } = useApp();
  const [matricule, setMatricule] = useState("MFP-2024-001");
  const [password, setPassword] = useState("password");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotMatricule, setForgotMatricule] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const user = users.find(u => u.matricule.toLowerCase() === matricule.trim().toLowerCase());
      if (user) {
        setCurrentUser(user, remember);
      } else {
        setError("Matricule ou mot de passe incorrect.");
      }
      setLoading(false);
    }, 800);
  };

  const closeForgot = () => { setShowForgot(false); setForgotMatricule(""); setForgotSent(false); };
  const submitForgot = () => setForgotSent(true);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#F4F6F9] px-4 py-10">
      {/* Letterhead */}
      <div className="flex flex-col items-center text-center mb-8">
        <img src={logoMfp} alt="République de Côte d'Ivoire — Ministère de la Fonction Publique" className="w-48 max-w-full h-auto" />
        <h1 className="text-sm font-bold text-gray-800 font-[family-name:var(--font-display)] mt-3 tracking-wide max-w-xs mx-auto">
          MINISTÈRE DE LA FONCTION PUBLIQUE ET DE LA MODERNISATION DE L'ADMINISTRATION
        </h1>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-display)] mb-1">Connexion</h2>
            <p className="text-sm text-gray-500">Accédez à votre espace personnel</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Matricule</label>
              <div className="relative">
                <IdCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={matricule}
                  onChange={e => setMatricule(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white form-input"
                  placeholder="MFP-2024-001"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-[#E8751A] hover:underline font-medium">Mot de passe oublié ?</button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white form-input"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-gray-300 accent-[#E8751A]" />
              <label htmlFor="remember" className="text-sm text-gray-600">Rester connecté</label>
            </div>

            <Button type="submit" loading={loading} className="w-full py-2.5" size="lg">
              Se connecter
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2024 Ministère de la Fonction Publique — République de Côte d'Ivoire
        </p>
      </div>

      <Modal open={showForgot} onClose={closeForgot} title="Mot de passe oublié"
        footer={forgotSent ? undefined : <><Button variant="ghost" size="sm" onClick={closeForgot}>Annuler</Button><Button size="sm" onClick={submitForgot} disabled={!forgotMatricule}>Envoyer</Button></>}>
        {forgotSent ? (
          <div className="text-center py-4">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-700 font-medium">Demande envoyée !</p>
            <p className="text-xs text-gray-500 mt-1">Si un compte existe pour le matricule {forgotMatricule}, un lien de réinitialisation a été envoyé à l'email associé.</p>
          </div>
        ) : (
          <Input label="Matricule" required placeholder="MFP-2024-001" value={forgotMatricule} onChange={e => setForgotMatricule(e.target.value)} />
        )}
      </Modal>
    </div>
  );
}
