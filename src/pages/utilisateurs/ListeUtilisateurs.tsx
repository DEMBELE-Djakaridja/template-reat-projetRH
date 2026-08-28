import { useState } from "react";
import Card from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import Input, { Select } from "../../components/UI/Input";
import { Search, UserPlus, Edit3, Power, RefreshCw, Trash2 } from "lucide-react";
import { useApp, ROLE_LABELS, roleLabel, DIRECTIONS, type UserRole } from "../../context/AppContext";

const roleBadge: Record<UserRole, any> = {
  admin: "danger",
  agent: "default",
  "gestionnaire-rh": "pending",
  "sous-directeur": "info",
  directeur: "info",
  drh: "warning",
  "sous-directeur-drh": "info",
  "gestionnaire-drh": "pending",
  "verificateur-rh": "pending",
};

const roleOptions = (Object.keys(ROLE_LABELS) as UserRole[]).map(value => ({ value, label: ROLE_LABELS[value] }));
const directionOptions = DIRECTIONS.map(d => ({ value: d, label: d }));

const emptyForm = { prenom: "", nom: "", email: "", matricule: "", role: "" as UserRole | "", direction: "" };

export default function ListeUtilisateurs() {
  const { users, toggleUserActif, deleteUser, updateUser, addUser, resetUserPassword } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = users.filter(u =>
    `${u.prenom} ${u.nom}`.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const editing = editId != null ? users.find(u => u.id === editId) ?? null : null;

  const openEdit = (id: number) => {
    const u = users.find(u => u.id === id);
    if (!u) return;
    setForm({ prenom: u.prenom, nom: u.nom, email: u.email, matricule: u.matricule, role: u.role, direction: u.direction });
    setEditId(id);
  };

  const closeModals = () => { setShowAdd(false); setEditId(null); setForm(emptyForm); };

  const handleCreate = () => {
    if (!form.prenom || !form.nom || !form.email || !form.role) return;
    addUser({ prenom: form.prenom, nom: form.nom, email: form.email, matricule: form.matricule || `MFP-2024-${Math.floor(Math.random() * 900 + 100)}`, role: form.role as UserRole, direction: form.direction, service: "" });
    closeModals();
  };

  const handleUpdate = () => {
    if (editId == null) return;
    updateUser(editId, { prenom: form.prenom, nom: form.nom, email: form.email, matricule: form.matricule, role: form.role as UserRole, direction: form.direction });
    closeModals();
  };

  const handleDelete = (id: number, nom: string) => {
    if (window.confirm(`Supprimer l'utilisateur ${nom} ? Cette action est irréversible.`)) deleteUser(id);
  };

  const handleReset = (id: number, nom: string) => {
    if (window.confirm(`Réinitialiser le mot de passe de ${nom} ?`)) resetUserPassword(id);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total utilisateurs", val: users.length },
            { label: "Actifs", val: users.filter(u => u.actif ?? true).length },
            { label: "Inactifs", val: users.filter(u => !(u.actif ?? true)).length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-center">
              <p className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)]">{s.val}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
        <Button icon={<UserPlus size={14} />} onClick={() => setShowAdd(true)}>Créer un utilisateur</Button>
      </div>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 form-input" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Utilisateur", "Email", "Rôle", "Direction", "Matricule", "Statut", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-3 first:pl-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.id} className="table-row group">
                  <td className="px-4 py-3.5 pl-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{u.prenom[0]}{u.nom[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{u.prenom} {u.nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{u.email}</td>
                  <td className="px-4 py-3.5"><Badge variant={roleBadge[u.role]} size="sm" dot>{roleLabel(u.role)}</Badge></td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{u.direction}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">{u.matricule}</td>
                  <td className="px-4 py-3.5">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${(u.actif ?? true) ? "text-green-600" : "text-gray-400"}`}>
                      <div className={`w-2 h-2 rounded-full ${(u.actif ?? true) ? "bg-green-400" : "bg-gray-300"}`} />
                      {(u.actif ?? true) ? "Actif" : "Inactif"}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(u.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors" title="Modifier"><Edit3 size={13} /></button>
                      <button onClick={() => toggleUserActif(u.id)} className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#E8751A] transition-colors" title="Activer/Désactiver"><Power size={13} /></button>
                      <button onClick={() => handleReset(u.id, `${u.prenom} ${u.nom}`)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-500 transition-colors" title="Réinitialiser MDP"><RefreshCw size={13} /></button>
                      <button onClick={() => handleDelete(u.id, `${u.prenom} ${u.nom}`)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Supprimer"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showAdd} onClose={closeModals} title="Créer un utilisateur"
        footer={<><Button variant="ghost" size="sm" onClick={closeModals}>Annuler</Button><Button size="sm" onClick={handleCreate} disabled={!form.prenom || !form.nom || !form.email || !form.role}>Créer l'utilisateur</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" required placeholder="Marie-Claire" value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} />
            <Input label="Nom" required placeholder="YAO" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
          </div>
          <Input label="Adresse email" type="email" required placeholder="m.yao@mfp.ci" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <Input label="Matricule" placeholder="MFP-2024-XXX" value={form.matricule} onChange={e => setForm(p => ({ ...p, matricule: e.target.value }))} />
          <Select label="Rôle" required options={roleOptions} placeholder="Choisir un rôle" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))} />
          <Select label="Direction" options={directionOptions} placeholder="Choisir une direction" value={form.direction} onChange={e => setForm(p => ({ ...p, direction: e.target.value }))} />
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-700">Un mot de passe temporaire sera envoyé par email à l'utilisateur.</p>
          </div>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={closeModals} title={editing ? `Modifier ${editing.prenom} ${editing.nom}` : ""}
        footer={<><Button variant="ghost" size="sm" onClick={closeModals}>Annuler</Button><Button size="sm" onClick={handleUpdate}>Enregistrer</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" required value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} />
            <Input label="Nom" required value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
          </div>
          <Input label="Adresse email" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <Input label="Matricule" value={form.matricule} onChange={e => setForm(p => ({ ...p, matricule: e.target.value }))} />
          <Select label="Rôle" required options={roleOptions} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))} />
          <Select label="Direction" options={directionOptions} placeholder="Choisir une direction" value={form.direction} onChange={e => setForm(p => ({ ...p, direction: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
