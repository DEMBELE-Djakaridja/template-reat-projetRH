import { useState } from "react";
import Card, { CardHeader, CardTitle } from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import Input from "../../components/UI/Input";
import { Plus, Check, Shield, CheckCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";

const DEFAULT_ROLES = [
  { id: 1, nom: "Administrateur", code: "admin", description: "Accès complet au système", users: 2, color: "#E8751A" },
  { id: 2, nom: "Agent", code: "agent", description: "Soumission de demandes", users: 18408, color: "#64748B" },
  { id: 3, nom: "Gestionnaire RH", code: "gestionnaire-rh", description: "Traitement des demandes RH", users: 15, color: "#D97706" },
  { id: 4, nom: "Sous Directeur", code: "sous-directeur", description: "Validation intermédiaire des demandes", users: 9, color: "#0EA5E9" },
  { id: 5, nom: "Directeur", code: "directeur", description: "Validation des demandes de sa direction", users: 12, color: "#2563EB" },
  { id: 6, nom: "DRH", code: "drh", description: "Gestion des ressources humaines", users: 5, color: "#009A4E" },
  { id: 7, nom: "Sous Directeur DRH", code: "sous-directeur-drh", description: "Validation intermédiaire à la DRH", users: 4, color: "#0891B2" },
  { id: 8, nom: "Gestionnaire DRH", code: "gestionnaire-drh", description: "Traitement des demandes à la DRH", users: 6, color: "#CA8A04" },
  { id: 9, nom: "Vérificateur RH", code: "verificateur-rh", description: "Vérification des dossiers RH", users: 8, color: "#7C3AED" },
];

const MODULES = ["Congés", "Permissions", "Planning", "Agents", "Utilisateurs", "Rôles", "Journal", "Paramètres", "Décisions", "Statistiques"];
const ACTIONS = ["Voir", "Créer", "Modifier", "Supprimer", "Valider", "Rejeter", "Exporter"];

const DEFAULT_MATRIX: Record<string, Record<string, string[]>> = {
  admin: { "Congés": ["Voir", "Créer", "Modifier", "Supprimer", "Valider", "Rejeter", "Exporter"], "Permissions": ["Voir", "Créer", "Modifier", "Supprimer", "Valider", "Rejeter", "Exporter"], "Planning": ["Voir", "Créer", "Modifier", "Supprimer"], "Agents": ["Voir", "Créer", "Modifier", "Supprimer", "Exporter"], "Utilisateurs": ["Voir", "Créer", "Modifier", "Supprimer"], "Rôles": ["Voir", "Créer", "Modifier", "Supprimer"], "Journal": ["Voir", "Exporter"], "Paramètres": ["Voir", "Modifier"], "Décisions": ["Voir", "Créer", "Modifier", "Supprimer", "Exporter"], "Statistiques": ["Voir", "Exporter"] },
  drh: { "Congés": ["Voir", "Créer", "Modifier", "Valider", "Rejeter", "Exporter"], "Permissions": ["Voir", "Créer", "Valider", "Rejeter", "Exporter"], "Planning": ["Voir", "Créer", "Modifier"], "Agents": ["Voir", "Exporter"], "Utilisateurs": ["Voir"], "Rôles": [], "Journal": ["Voir"], "Paramètres": [], "Décisions": ["Voir", "Créer", "Modifier", "Exporter"], "Statistiques": ["Voir", "Exporter"] },
  directeur: { "Congés": ["Voir", "Créer", "Valider", "Rejeter"], "Permissions": ["Voir", "Créer", "Valider", "Rejeter"], "Planning": ["Voir"], "Agents": ["Voir"], "Utilisateurs": [], "Rôles": [], "Journal": ["Voir"], "Paramètres": [], "Décisions": ["Voir"], "Statistiques": ["Voir"] },
  agent: { "Congés": ["Voir", "Créer"], "Permissions": ["Voir", "Créer"], "Planning": ["Voir"], "Agents": [], "Utilisateurs": [], "Rôles": [], "Journal": [], "Paramètres": [], "Décisions": ["Voir"], "Statistiques": [] },
};

export default function GestionRoles() {
  const { addJournalEntry } = useApp();
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newRoleNom, setNewRoleNom] = useState("");

  const toggle = (module: string, action: string) => {
    setMatrix(prev => {
      const current = prev[selectedRole]?.[module] ?? [];
      const updated = current.includes(action) ? current.filter(a => a !== action) : [...current, action];
      return { ...prev, [selectedRole]: { ...prev[selectedRole], [module]: updated } };
    });
  };

  const hasPermission = (module: string, action: string) =>
    matrix[selectedRole]?.[module]?.includes(action) ?? false;

  const roleData = roles.find(r => r.code === selectedRole);

  const handleSave = () => {
    addJournalEntry({ action: "Modification des permissions", detail: `Permissions du rôle ${roleData?.nom ?? selectedRole} enregistrées`, type: "info" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAddRole = () => {
    if (!newRoleNom.trim()) return;
    const code = newRoleNom.trim().toLowerCase().replace(/\s+/g, "-");
    setRoles(prev => [...prev, { id: prev.reduce((m, r) => Math.max(m, r.id), 0) + 1, nom: newRoleNom.trim(), code, description: "Rôle personnalisé", users: 0, color: "#64748B" }]);
    setMatrix(prev => ({ ...prev, [code]: {} }));
    setNewRoleNom("");
    setShowAdd(false);
    setSelectedRole(code);
  };

  return (
    <div className="space-y-5">
      {saved && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle size={16} />Permissions enregistrées avec succès
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Roles list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 font-[family-name:var(--font-display)]">Rôles</h3>
            <Button size="sm" icon={<Plus size={12} />} onClick={() => setShowAdd(true)}>Ajouter</Button>
          </div>
          {roles.map(r => (
            <button
              key={r.code}
              onClick={() => setSelectedRole(r.code)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedRole === r.code ? "border-[#E8751A] bg-orange-50 shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: r.color + "20" }}>
                  <Shield size={14} style={{ color: r.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{r.nom}</p>
                  <p className="text-xs text-gray-400">{r.users.toLocaleString("fr-FR")} utilisateurs</p>
                </div>
                {selectedRole === r.code && <div className="w-1.5 h-1.5 rounded-full bg-[#E8751A]" />}
              </div>
            </button>
          ))}
        </div>

        {/* Permissions matrix */}
        <div className="lg:col-span-3">
          <Card padding="none">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: (roleData?.color ?? "#E8751A") + "20" }}>
                  <Shield size={16} style={{ color: roleData?.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 font-[family-name:var(--font-display)]">{roleData?.nom}</h3>
                  <p className="text-xs text-gray-500">{roleData?.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>Enregistrer</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="text-left text-xs text-gray-500 font-semibold px-6 py-3 w-32">Module</th>
                    {ACTIONS.map(a => (
                      <th key={a} className="text-center text-xs text-gray-500 font-semibold px-3 py-3">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MODULES.map(mod => (
                    <tr key={mod} className="table-row">
                      <td className="px-6 py-3">
                        <span className="text-xs font-semibold text-gray-700">{mod}</span>
                      </td>
                      {ACTIONS.map(action => {
                        const active = hasPermission(mod, action);
                        return (
                          <td key={action} className="px-3 py-3 text-center">
                            <button
                              onClick={() => toggle(mod, action)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-all
                                ${active ? "bg-[#E8751A] text-white shadow-sm hover:bg-[#C45E0D]" : "bg-gray-100 text-gray-300 hover:bg-gray-200"}`}
                            >
                              {active && <Check size={12} strokeWidth={3} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-[#E8751A]" /><span>Autorisé</span></div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-gray-100" /><span>Non autorisé</span></div>
              <span className="ml-auto text-gray-300">Cliquez sur une case pour modifier les permissions</span>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Ajouter un rôle"
        footer={<><Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Annuler</Button><Button size="sm" onClick={handleAddRole} disabled={!newRoleNom.trim()}>Créer</Button></>}>
        <Input label="Nom du rôle" required placeholder="Ex: Superviseur" value={newRoleNom} onChange={e => setNewRoleNom(e.target.value)} />
      </Modal>
    </div>
  );
}
