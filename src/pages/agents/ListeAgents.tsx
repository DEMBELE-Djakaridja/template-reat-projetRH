import { useState } from "react";
import Card from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import Input, { Select } from "../../components/UI/Input";
import { Search, Filter, Download, UserPlus, Eye, MoreHorizontal, Edit3, Trash2 } from "lucide-react";
import { useApp, DIRECTIONS } from "../../context/AppContext";
import { downloadCsv } from "../../lib/csv";

const directionOptions = DIRECTIONS.map(d => ({ value: d, label: d }));

const emptyForm = { nom: "", matricule: "", direction: "", service: "", grade: "" };

export default function ListeAgents() {
  const { agents, addAgent, updateAgent, deleteAgent } = useApp();
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDirection, setFilterDirection] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [ficheId, setFicheId] = useState<number | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [newAgent, setNewAgent] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const directions = ["all", ...DIRECTIONS];

  const filtered = agents.filter(a => {
    const m = a.nom.toLowerCase().includes(search.toLowerCase()) || a.matricule.includes(search);
    const s = filterStatut === "all" || a.statut === filterStatut;
    const d = filterDirection === "all" || a.direction === filterDirection;
    return m && s && d;
  });

  const fiche = ficheId != null ? agents.find(a => a.id === ficheId) ?? null : null;
  const editing = editId != null ? agents.find(a => a.id === editId) ?? null : null;

  const exportCsv = () => {
    downloadCsv("agents", filtered.map(a => ({ Nom: a.nom, Matricule: a.matricule, Direction: a.direction, Service: a.service, Grade: a.grade, Statut: a.statut === "active" ? "Actif" : "En congé", Solde: a.solde, Pris: a.pris })));
  };

  const handleAdd = () => {
    if (!newAgent.nom || !newAgent.matricule) return;
    addAgent(newAgent);
    setNewAgent(emptyForm);
    setShowAdd(false);
  };

  const openEdit = (id: number) => {
    const a = agents.find(a => a.id === id);
    if (!a) return;
    setEditForm({ nom: a.nom, matricule: a.matricule, direction: a.direction, service: a.service, grade: a.grade });
    setEditId(id);
    setMenuId(null);
  };

  const handleUpdate = () => {
    if (editId == null || !editForm.nom || !editForm.matricule) return;
    updateAgent(editId, editForm);
    setEditId(null);
  };

  const handleDelete = (id: number, nom: string) => {
    setMenuId(null);
    if (window.confirm(`Supprimer l'agent ${nom} ? Cette action est irréversible.`)) deleteAgent(id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un agent..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white form-input" />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {[["all", "Tous"], ["active", "Actif"], ["conge", "En congé"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatut(val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterStatut === val ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>{label}</button>
          ))}
        </div>
        <Button variant="outline" size="sm" icon={<Filter size={14} />} onClick={() => setShowFilters(v => !v)}>Filtres</Button>
        <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportCsv}>Exporter</Button>
        <Button size="sm" icon={<UserPlus size={14} />} onClick={() => setShowAdd(true)}>Ajouter</Button>
      </div>

      {showFilters && (
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Direction :</span>
            <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white form-input">
              {directions.map(d => <option key={d} value={d}>{d === "all" ? "Toutes" : d}</option>)}
            </select>
          </div>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total agents", val: agents.length },
          { label: "Actifs", val: agents.filter(a => a.statut === "active").length },
          { label: "En congé", val: agents.filter(a => a.statut === "conge").length },
          { label: "Solde moyen", val: `${agents.length ? Math.round(agents.reduce((s, a) => s + (a.solde - a.pris), 0) / agents.length) : 0}j` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-display)]">{s.val}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => {
          const soldeRestant = a.solde - a.pris;
          const pct = Math.round((a.pris / a.solde) * 100);
          return (
            <div key={a.id} className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-base">{a.nom.split(" ")[1]?.[0] ?? a.nom[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{a.nom}</p>
                    <p className="text-xs font-mono text-gray-400">{a.matricule}</p>
                  </div>
                </div>
                <Badge variant={a.statut === "active" ? "success" : "warning"} dot size="sm">
                  {a.statut === "active" ? "Actif" : "En congé"}
                </Badge>
              </div>
              <div className="space-y-1 mb-4 text-xs text-gray-500">
                <p><span className="text-gray-400">Direction :</span> <span className="text-gray-700 font-medium">{a.direction}</span></p>
                <p><span className="text-gray-400">Grade :</span> <span className="text-gray-700 font-medium">{a.grade}</span></p>
              </div>
              {/* Solde bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Solde congés</span>
                  <span className="font-semibold text-gray-700">{soldeRestant}j restants / {a.solde}j</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#E8751A] to-[#C45E0D] transition-all"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setFicheId(a.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#E8751A] bg-gray-50 hover:bg-orange-50 rounded-lg py-2 transition-colors">
                  <Eye size={12} />Fiche
                </button>
                <button onClick={() => setMenuId(menuId === a.id ? null : a.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg py-2 transition-colors">
                  <MoreHorizontal size={12} />Actions
                </button>
              </div>
              {menuId === a.id && (
                <div className="absolute right-3 bottom-14 z-10 bg-white border border-gray-100 rounded-xl shadow-lg text-xs w-40 overflow-hidden">
                  <button onClick={() => setFicheId(a.id)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"><Eye size={12} />Voir la fiche</button>
                  <button onClick={() => openEdit(a.id)} className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-700 flex items-center gap-2"><Edit3 size={12} />Modifier</button>
                  <button onClick={() => handleDelete(a.id, a.nom)} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={12} />Supprimer</button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-gray-400 py-10">Aucun agent ne correspond à ces filtres.</p>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Ajouter un agent"
        footer={<><Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Annuler</Button><Button size="sm" onClick={handleAdd} disabled={!newAgent.nom || !newAgent.matricule}>Ajouter</Button></>}>
        <div className="space-y-4">
          <Input label="Nom complet" required value={newAgent.nom} onChange={e => setNewAgent(p => ({ ...p, nom: e.target.value }))} placeholder="YAO Marie-Claire" />
          <Input label="Matricule" required value={newAgent.matricule} onChange={e => setNewAgent(p => ({ ...p, matricule: e.target.value }))} placeholder="MFP-2024-XXX" />
          <Select label="Direction" options={directionOptions} placeholder="Choisir une direction" value={newAgent.direction} onChange={e => setNewAgent(p => ({ ...p, direction: e.target.value }))} />
          <Input label="Service" value={newAgent.service} onChange={e => setNewAgent(p => ({ ...p, service: e.target.value }))} />
          <Input label="Grade" value={newAgent.grade} onChange={e => setNewAgent(p => ({ ...p, grade: e.target.value }))} />
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditId(null)} title={editing ? `Modifier ${editing.nom}` : ""}
        footer={<><Button variant="ghost" size="sm" onClick={() => setEditId(null)}>Annuler</Button><Button size="sm" onClick={handleUpdate} disabled={!editForm.nom || !editForm.matricule}>Enregistrer</Button></>}>
        <div className="space-y-4">
          <Input label="Nom complet" required value={editForm.nom} onChange={e => setEditForm(p => ({ ...p, nom: e.target.value }))} />
          <Input label="Matricule" required value={editForm.matricule} onChange={e => setEditForm(p => ({ ...p, matricule: e.target.value }))} />
          <Select label="Direction" options={directionOptions} placeholder="Choisir une direction" value={editForm.direction} onChange={e => setEditForm(p => ({ ...p, direction: e.target.value }))} />
          <Input label="Service" value={editForm.service} onChange={e => setEditForm(p => ({ ...p, service: e.target.value }))} />
          <Input label="Grade" value={editForm.grade} onChange={e => setEditForm(p => ({ ...p, grade: e.target.value }))} />
        </div>
      </Modal>

      <Modal open={!!fiche} onClose={() => setFicheId(null)} title={fiche ? fiche.nom : ""}>
        {fiche && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-xs text-gray-500 block">Matricule</span><span className="font-semibold text-gray-800 font-mono">{fiche.matricule}</span></div>
              <div><span className="text-xs text-gray-500 block">Grade</span><span className="font-semibold text-gray-800">{fiche.grade}</span></div>
              <div><span className="text-xs text-gray-500 block">Direction</span><span className="font-semibold text-gray-800">{fiche.direction}</span></div>
              <div><span className="text-xs text-gray-500 block">Service</span><span className="font-semibold text-gray-800">{fiche.service}</span></div>
              <div><span className="text-xs text-gray-500 block">Solde</span><span className="font-semibold text-gray-800">{fiche.solde - fiche.pris}j restants / {fiche.solde}j</span></div>
              <div><span className="text-xs text-gray-500 block">Statut</span><Badge variant={fiche.statut === "active" ? "success" : "warning"} dot size="sm">{fiche.statut === "active" ? "Actif" : "En congé"}</Badge></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
