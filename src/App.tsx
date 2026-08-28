import { AppProvider, useApp } from "./context/AppContext";
import Login from "./pages/auth/Login";
import Sidebar from "./components/Layout/Sidebar";
import Header from "./components/Layout/Header";
import Dashboard from "./pages/Dashboard";
import ListeConges from "./pages/conges/ListeConges";
import NouvelleDemandeConge from "./pages/conges/NouvelleDemandeConge";
import DecisionConge from "./pages/conges/DecisionConge";
import ImputationConge from "./pages/conges/ImputationConge";
import ProductionActes from "./pages/conges/ProductionActes";
import ListePermissions from "./pages/permissions/ListePermissions";
import NouvellePermission from "./pages/permissions/NouvellePermission";
import PlanningConges from "./pages/planning/PlanningConges";
import ListeAgents from "./pages/agents/ListeAgents";
import ListeUtilisateurs from "./pages/utilisateurs/ListeUtilisateurs";
import GestionRoles from "./pages/roles/GestionRoles";
import JournalActions from "./pages/journal/JournalActions";
import MonCompte from "./pages/parametres/MonCompte";
import Statistiques from "./pages/Statistiques";

function PageRouter() {
  const { currentPage } = useApp();
  switch (currentPage) {
    case "dashboard": return <Dashboard />;
    case "conge-liste": return <ListeConges />;
    case "conge-nouvelle": return <NouvelleDemandeConge />;
    case "conge-validation": return <ListeConges />;
    case "conge-decisions": return <DecisionConge />;
    case "conge-imputation": return <ImputationConge />;
    case "conge-actes": return <ProductionActes />;
    case "perm-liste": return <ListePermissions />;
    case "perm-nouvelle": return <NouvellePermission />;
    case "perm-validation": return <ListePermissions />;
    case "planning": return <PlanningConges />;
    case "stats": return <Statistiques />;
    case "agents": return <ListeAgents />;
    case "utilisateurs": return <ListeUtilisateurs />;
    case "roles": return <GestionRoles />;
    case "journal": return <JournalActions />;
    case "compte": return <MonCompte />;
    default: return <Dashboard />;
  }
}

function AppShell() {
  const { currentUser, sidebarOpen } = useApp();
  if (!currentUser) return <Login />;

  return (
    <div className="flex h-full bg-[#F4F6F9]">
      <Sidebar />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-16"}`}>
        <Header />
        <main className="flex-1 p-5 md:p-6 overflow-auto">
          <PageRouter />
        </main>
        <footer className="px-6 py-3 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
          <p className="text-xs text-gray-400 text-center">
            GCP — Gestion des Congés & Permissions · Ministère de la Fonction Publique de Côte d'Ivoire et de la Modernisation de l'administration · v1.0.0 · {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
