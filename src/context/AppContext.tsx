import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole =
  | "admin"
  | "agent"
  | "gestionnaire-rh"
  | "sous-directeur"
  | "directeur"
  | "drh"
  | "sous-directeur-drh"
  | "gestionnaire-drh"
  | "verificateur-rh";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  agent: "Agent",
  "gestionnaire-rh": "Gestionnaire RH",
  "sous-directeur": "Sous Directeur",
  directeur: "Directeur",
  drh: "DRH",
  "sous-directeur-drh": "Sous Directeur DRH",
  "gestionnaire-drh": "Gestionnaire DRH",
  "verificateur-rh": "Vérificateur RH",
};

export const roleLabel = (role: string) => ROLE_LABELS[role as UserRole] ?? role;

export const DIRECTIONS: string[] = [
  "Inspection générale",
  "Secrétariat de l'Ordre du Mérite",
  "Cellule de Passation des Marchés Publics",
  "Service de Gestion du Patrimoine",
  "Organe consultatif",
  "Direction de la Qualité et de l'Accompagnement du Changement",
  "Direction Générale de la Fonction Publique",
  "Direction des Affaires Financières",
  "Direction de la Planification, des Statistiques et de l'Évaluation",
  "Direction des Affaires Juridiques et du Contentieux",
  "Direction de la Communication et des Relations Publiques",
  "Direction Générale de la Transformation du Service Public",
  "Direction des Ressources Humaines",
  "Direction des Systèmes d'Information",
];

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  direction: string;
  service: string;
  matricule: string;
  avatar?: string;
  actif?: boolean;
}

export interface Agent {
  id: number;
  nom: string;
  matricule: string;
  direction: string;
  service: string;
  grade: string;
  statut: "active" | "conge";
  solde: number;
  pris: number;
  dateEmbauche: string;
}

export function hasOneYearService(dateEmbauche: string): boolean {
  const [d, m, y] = dateEmbauche.split("/").map(Number);
  if (!d || !m || !y) return false;
  const hire = new Date(y, m - 1, d);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return hire <= oneYearAgo;
}

export type CongeStatut = "pending" | "success" | "warning" | "danger" | "info";

export interface CongeRequest {
  id: string;
  agent: string;
  matricule: string;
  direction: string;
  type: string;
  debut: string;
  fin: string;
  duree: number;
  statut: CongeStatut;
  motif: string;
  soumis: string;
  urgence: boolean;
  motifRejet?: string;
  fichiers?: string[];
  imputeA?: string;
  imputeMatricule?: string;
  imputeGDRH?: string;
  imputeGDRHMatricule?: string;
}

// Circuit de traitement de la permission : Gestionnaire RH valide et impute au Sous-Directeur →
// celui-ci valide et transmet au Directeur → celui-ci valide et retransmet au Sous-Directeur →
// celui-ci transmet au Gestionnaire RH → celui-ci crée l'acte administratif de permission (final).
export type PermissionStatut =
  | "pending"
  | "attente_sous_directeur"
  | "attente_directeur"
  | "attente_transmission_grh"
  | "attente_acte"
  | "success"
  | "danger";

export interface PermissionRequest {
  id: string;
  agent: string;
  matricule: string;
  direction: string;
  date: string;
  motif: string;
  duree: string;
  statut: PermissionStatut;
  acte: boolean;
  motifRejet?: string;
}

export interface DecisionAgentRow {
  nom: string;
  matricule: string;
  direction: string;
  type: string;
  debut: string;
  fin: string;
  duree: number;
}

export type DecisionStatut = "draft" | "pending" | "signed";

export interface Decision {
  id: string;
  ref: string;
  titre: string;
  type: string;
  statut: DecisionStatut;
  dateCreation: string;
  dateSignature?: string;
  agents: DecisionAgentRow[];
}

// L'acte de cessation est distinct de la décision de congé : il constate l'arrêt
// d'activité de l'agent pour une demande de congé déjà validée par le Directeur.
// Circuit : le DRH impute la demande validée au Sous-Directeur DRH, qui l'impute à son tour
// au Gestionnaire DRH — cette dernière imputation crée l'acte. Celui-ci produit l'acte et le
// transmet au Vérificateur RH → celui-ci vérifie et valide → retour au Gestionnaire DRH qui
// transmet au Sous-Directeur DRH → celui-ci valide → le Directeur signe l'acte et notifie
// l'agent, qui peut alors le télécharger.
export type ActeStatut =
  | "attente_production"
  | "attente_verification"
  | "attente_transmission"
  | "attente_validation_sddrh"
  | "attente_signature"
  | "signe";

export interface Acte {
  id: string;
  congeId: string;
  agent: string;
  matricule: string;
  direction: string;
  type: string;
  debut: string;
  fin: string;
  duree: number;
  statut: ActeStatut;
  sousDirecteurDrh?: string;
  sousDirecteurDrhMatricule?: string;
  gestionnaireDrh?: string;
  gestionnaireDrhMatricule?: string;
  motifRejet?: string;
  dateCreation: string;
  dateProduction?: string;
  dateVerification?: string;
  dateValidationSDDRH?: string;
  dateSignature?: string;
  signatureDataUrl?: string;
}

export type JournalType = "success" | "danger" | "info" | "warning" | "default";

export interface JournalEntry {
  id: number;
  user: string;
  role: string;
  action: string;
  detail: string;
  date: string;
  heure: string;
  type: JournalType;
  ip: string;
}

export type NotificationAudience = "actors" | "agent";

export interface AppNotification {
  id: number;
  title: string;
  detail: string;
  date: string;
  heure: string;
  type: JournalType;
  audience: NotificationAudience;
  matricule?: string;
  page?: string;
  read: boolean;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null, remember?: boolean) => void;
  currentPage: string;
  setCurrentPage: (p: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;

  users: User[];
  agents: Agent[];
  conges: CongeRequest[];
  permissions: PermissionRequest[];
  decisions: Decision[];
  actes: Acte[];
  journal: JournalEntry[];
  notifications: AppNotification[];
  markNotificationRead: (id: number) => void;
  markAllNotificationsRead: (audience: NotificationAudience, matricule?: string) => void;

  addConge: (data: { agent: string; matricule: string; direction: string; type: string; debut: string; fin: string; duree: number; motif: string; urgence?: boolean; fichiers?: string[] }) => CongeRequest;
  decideConge: (ids: string[], action: "approve" | "reject", motif?: string) => void;
  deleteConge: (id: string) => void;
  imputerConge: (id: string, collaborateurMatricule: string) => void;
  imputerCongeGDRH: (id: string, collaborateurMatricule: string) => void;

  addPermission: (data: { agent: string; matricule: string; direction: string; date: string; motif: string; duree: string }) => PermissionRequest;
  decidePermission: (ids: string[], action: "approve" | "reject", motif?: string) => void;
  transmettrePermission: (id: string) => void;
  creerActePermission: (id: string) => void;

  addUser: (data: { nom: string; prenom: string; email: string; role: UserRole; direction: string; service: string; matricule: string }) => User;
  updateUser: (id: number, data: Partial<User>) => void;
  toggleUserActif: (id: number) => void;
  deleteUser: (id: number) => void;
  resetUserPassword: (id: number) => void;

  addAgent: (data: { nom: string; matricule: string; direction: string; service: string; grade: string }) => Agent;
  updateAgent: (id: number, data: Partial<Agent>) => void;
  deleteAgent: (id: number) => void;

  createDecision: (data: { titre: string; type: string; agents: DecisionAgentRow[] }) => Decision;
  signDecision: (id: string) => void;

  produireActe: (acteId: string) => void;
  deciderVerificationActe: (acteId: string, action: "approve" | "reject", motif?: string) => void;
  transmettreActe: (acteId: string) => void;
  deciderValidationSDDRH: (acteId: string, action: "approve" | "reject", motif?: string) => void;
  signerActe: (acteId: string, signatureDataUrl?: string) => void;

  addJournalEntry: (data: { action: string; detail: string; type?: JournalType }) => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const MOCK_USERS: User[] = [
  { id: 1, nom: "KOUASSI", prenom: "Aimé Bernard", email: "a.kouassi@mfp.ci", role: "admin", direction: "Direction des Systèmes d'Information", service: "Informatique", matricule: "MFP-2024-001", actif: true },
  { id: 2, nom: "YAO", prenom: "Marie-Claire", email: "m.yao@mfp.ci", role: "drh", direction: "Direction des Ressources Humaines", service: "Gestion RH", matricule: "MFP-2024-002", actif: true },
  { id: 3, nom: "BAMBA", prenom: "Ibrahima", email: "i.bamba@mfp.ci", role: "directeur", direction: "Direction des Ressources Humaines", service: "Direction", matricule: "MFP-2024-003", actif: true },
  { id: 4, nom: "KONÉ", prenom: "Fatou", email: "f.kone@mfp.ci", role: "agent", direction: "Direction des Affaires Financières", service: "Traitement des Salaires", matricule: "MFP-2024-047", actif: true },
];

const EXTRA_USERS: User[] = [
  { id: 5, nom: "KOUADIO", prenom: "Jean-Pierre", email: "j.kouadio@mfp.ci", role: "agent", direction: "Direction des Affaires Financières", service: "Budget", matricule: "MFP-2024-089", actif: false },
  { id: 6, nom: "SORO", prenom: "Aminata", email: "a.soro@mfp.ci", role: "agent", direction: "Direction de la Planification, des Statistiques et de l'Évaluation", service: "Fiscalité", matricule: "MFP-2024-134", actif: true },
  { id: 7, nom: "DIOMANDÉ", prenom: "Karim", email: "k.diomande@mfp.ci", role: "verificateur-rh", direction: "Direction des Ressources Humaines", service: "Vérification", matricule: "MFP-2024-078", actif: true },
  { id: 8, nom: "N'GORAN", prenom: "Emmanuel", email: "e.ngoran@mfp.ci", role: "agent", direction: "Direction des Ressources Humaines", service: "Formation", matricule: "MFP-2024-189", actif: true },
  { id: 9, nom: "GBAGBO", prenom: "Serge", email: "s.gbagbo@mfp.ci", role: "agent", direction: "Direction des Affaires Financières", service: "Trésorerie", matricule: "MFP-2024-201", actif: true },
  { id: 10, nom: "TOURÉ", prenom: "Mamadou", email: "m.toure@mfp.ci", role: "agent", direction: "Direction de la Planification, des Statistiques et de l'Évaluation", service: "Fiscalité", matricule: "MFP-2024-312", actif: true },
  { id: 11, nom: "AKPA", prenom: "Laurette", email: "l.akpa@mfp.ci", role: "agent", direction: "Direction des Ressources Humaines", service: "Formation", matricule: "MFP-2024-445", actif: true },
  { id: 12, nom: "OUATTARA", prenom: "Aya", email: "a.ouattara@mfp.ci", role: "gestionnaire-rh", direction: "Direction des Ressources Humaines", service: "Gestion RH", matricule: "MFP-2024-501", actif: true },
  { id: 13, nom: "KONAN", prenom: "Yves", email: "y.konan@mfp.ci", role: "sous-directeur", direction: "Direction des Affaires Financières", service: "Direction", matricule: "MFP-2024-502", actif: true },
  { id: 14, nom: "BAKAYOKO", prenom: "Awa", email: "a.bakayoko@mfp.ci", role: "sous-directeur-drh", direction: "Direction des Ressources Humaines", service: "Direction", matricule: "MFP-2024-503", actif: true },
  { id: 15, nom: "COULIBALY", prenom: "Moussa", email: "m.coulibaly@mfp.ci", role: "gestionnaire-drh", direction: "Direction des Ressources Humaines", service: "Gestion RH", matricule: "MFP-2024-504", actif: true },
];

const DEFAULT_USERS: User[] = [...MOCK_USERS, ...EXTRA_USERS];

const DEFAULT_AGENTS: Agent[] = [
  { id: 1, nom: "KOUASSI Aimé Bernard", matricule: "MFP-2024-001", direction: "Direction des Systèmes d'Information", service: "Informatique", grade: "Administrateur Civil", statut: "active", solde: 42, pris: 21, dateEmbauche: "15/03/2015" },
  { id: 2, nom: "YAO Marie-Claire", matricule: "MFP-2024-002", direction: "Direction des Ressources Humaines", service: "Gestion RH", grade: "Inspecteur du Trésor", statut: "active", solde: 30, pris: 9, dateEmbauche: "10/06/2018" },
  { id: 3, nom: "BAMBA Ibrahima", matricule: "MFP-2024-003", direction: "Direction des Ressources Humaines", service: "Direction", grade: "Directeur", statut: "conge", solde: 42, pris: 30, dateEmbauche: "01/09/2010" },
  { id: 4, nom: "KONÉ Fatou", matricule: "MFP-2024-047", direction: "Direction des Affaires Financières", service: "Traitement Salaires", grade: "Contrôleur Financier", statut: "active", solde: 42, pris: 15, dateEmbauche: "12/01/2020" },
  { id: 5, nom: "KOUADIO Jean-Pierre", matricule: "MFP-2024-089", direction: "Direction des Affaires Financières", service: "Budget", grade: "Comptable Public", statut: "conge", solde: 42, pris: 42, dateEmbauche: "05/11/2019" },
  { id: 6, nom: "SORO Aminata", matricule: "MFP-2024-134", direction: "Direction de la Planification, des Statistiques et de l'Évaluation", service: "Fiscalité", grade: "Inspecteur des Impôts", statut: "active", solde: 30, pris: 0, dateEmbauche: "20/02/2021" },
  { id: 7, nom: "N'GORAN Emmanuel", matricule: "MFP-2024-189", direction: "Direction des Ressources Humaines", service: "Formation", grade: "Formateur Principal", statut: "active", solde: 42, pris: 7, dateEmbauche: "01/04/2022" },
  { id: 8, nom: "DIOMANDÉ Karim", matricule: "MFP-2024-078", direction: "Direction des Ressources Humaines", service: "Vérification", grade: "Vérificateur Principal", statut: "active", solde: 42, pris: 5, dateEmbauche: "15/07/2023" },
  { id: 9, nom: "GBAGBO Serge", matricule: "MFP-2024-201", direction: "Direction des Affaires Financières", service: "Trésorerie", grade: "Trésorier Adjoint", statut: "conge", solde: 90, pris: 90, dateEmbauche: "10/10/2017" },
  { id: 10, nom: "TOURÉ Mamadou", matricule: "MFP-2024-312", direction: "Direction de la Planification, des Statistiques et de l'Évaluation", service: "Fiscalité", grade: "Inspecteur des Impôts", statut: "active", solde: 30, pris: 7, dateEmbauche: "15/01/2026" },
  { id: 11, nom: "AKPA Laurette", matricule: "MFP-2024-445", direction: "Direction des Ressources Humaines", service: "Formation", grade: "Formatrice", statut: "active", solde: 30, pris: 1, dateEmbauche: "01/06/2020" },
  { id: 12, nom: "OUATTARA Aya", matricule: "MFP-2024-501", direction: "Direction des Ressources Humaines", service: "Gestion RH", grade: "Gestionnaire RH", statut: "active", solde: 30, pris: 4, dateEmbauche: "01/09/2021" },
  { id: 13, nom: "KONAN Yves", matricule: "MFP-2024-502", direction: "Direction des Affaires Financières", service: "Direction", grade: "Sous Directeur", statut: "active", solde: 30, pris: 10, dateEmbauche: "01/02/2015" },
  { id: 14, nom: "BAKAYOKO Awa", matricule: "MFP-2024-503", direction: "Direction des Ressources Humaines", service: "Direction", grade: "Sous Directeur DRH", statut: "active", solde: 30, pris: 6, dateEmbauche: "01/05/2019" },
  { id: 15, nom: "COULIBALY Moussa", matricule: "MFP-2024-504", direction: "Direction des Ressources Humaines", service: "Gestion RH", grade: "Gestionnaire DRH", statut: "active", solde: 30, pris: 2, dateEmbauche: "01/03/2022" },
];

const DEFAULT_CONGES: CongeRequest[] = [
  { id: "DC-2024-001", agent: "GBAGBO Serge", matricule: "MFP-2024-201", direction: "Direction des Affaires Financières", type: "Congé annuel", debut: "15/09/2026", fin: "06/10/2026", duree: 21, statut: "warning", motif: "Repos annuel", soumis: "01/09/2026", urgence: false },
  { id: "DC-2024-002", agent: "SORO Aminata", matricule: "MFP-2024-134", direction: "Direction de la Planification, des Statistiques et de l'Évaluation", type: "Congé maladie", debut: "10/09/2026", fin: "20/09/2026", duree: 10, statut: "warning", motif: "Certificat médical", soumis: "05/09/2026", urgence: true },
  { id: "DC-2024-003", agent: "AKPA Laurette", matricule: "MFP-2024-445", direction: "Direction des Ressources Humaines", type: "Congé annuel", debut: "01/10/2026", fin: "22/10/2026", duree: 21, statut: "warning", motif: "Repos annuel", soumis: "20/09/2026", urgence: false },
  { id: "DC-2024-004", agent: "N'GORAN Emmanuel", matricule: "MFP-2024-189", direction: "Direction des Ressources Humaines", type: "Congé annuel", debut: "05/11/2026", fin: "26/11/2026", duree: 21, statut: "pending", motif: "Repos annuel", soumis: "28/08/2026", urgence: false },
  { id: "DC-2024-005", agent: "TOURÉ Mamadou", matricule: "MFP-2024-312", direction: "Direction de la Planification, des Statistiques et de l'Évaluation", type: "Congé maladie", debut: "01/09/2026", fin: "08/09/2026", duree: 7, statut: "pending", motif: "Certificat médical", soumis: "26/08/2026", urgence: true },
  { id: "DC-2024-006", agent: "DIOMANDÉ Karim", matricule: "MFP-2024-078", direction: "Direction des Ressources Humaines", type: "Permission", debut: "02/09/2026", fin: "02/09/2026", duree: 1, statut: "pending", motif: "Démarches administratives", soumis: "27/08/2026", urgence: false },
];

const DEFAULT_PERMISSIONS: PermissionRequest[] = [];

// La décision de congé ne concerne que les congés annuels.
const DEFAULT_DECISIONS: Decision[] = [
  {
    id: "DEC-2024-001", ref: "MFP-2024-047", titre: "Décision de congé annuel — KONÉ Fatou", type: "Congé annuel", statut: "signed", dateCreation: "01/12/2024", dateSignature: "03/12/2024",
    agents: [
      { nom: "KONÉ Fatou", matricule: "MFP-2024-047", direction: "Direction des Affaires Financières", type: "Congé annuel", debut: "15/12/2024", fin: "05/01/2025", duree: 21 },
    ],
  },
  {
    id: "DEC-2024-002", ref: "MFP-2024-201,MFP-2024-445,MFP-2024-189", titre: "Décision collective — Congés annuels", type: "Congé annuel", statut: "signed", dateCreation: "24/08/2026", dateSignature: "25/08/2026",
    agents: [
      { nom: "GBAGBO Serge", matricule: "MFP-2024-201", direction: "Direction des Affaires Financières", type: "Congé annuel", debut: "15/09/2026", fin: "06/10/2026", duree: 21 },
      { nom: "AKPA Laurette", matricule: "MFP-2024-445", direction: "Direction des Ressources Humaines", type: "Congé annuel", debut: "01/10/2026", fin: "22/10/2026", duree: 21 },
      { nom: "N'GORAN Emmanuel", matricule: "MFP-2024-189", direction: "Direction des Ressources Humaines", type: "Congé annuel", debut: "05/11/2026", fin: "26/11/2026", duree: 21 },
    ],
  },
];

const DEFAULT_JOURNAL: JournalEntry[] = [
  { id: 1, user: "YAO Marie-Claire", role: "drh", action: "Création décision", detail: "Décision DEC-2024-001 créée — 1 agent(s)", date: "01/12/2024", heure: "10:15", type: "info", ip: "192.168.1.22" },
  { id: 2, user: "YAO Marie-Claire", role: "drh", action: "Signature décision", detail: "Décision DEC-2024-001 signée et publiée", date: "03/12/2024", heure: "09:40", type: "success", ip: "192.168.1.22" },
  { id: 3, user: "GBAGBO Serge", role: "agent", action: "Soumission congé", detail: "Demande DC-2024-001 soumise — 21 jours", date: "01/09/2026", heure: "08:12", type: "default", ip: "192.168.2.101" },
  { id: 4, user: "OUATTARA Aya", role: "gestionnaire-rh", action: "Validation Gestionnaire RH", detail: "DC-2024-001 validée(s) par Gestionnaire RH — en cours", date: "02/09/2026", heure: "09:30", type: "success", ip: "192.168.1.30" },
  { id: 5, user: "SORO Aminata", role: "agent", action: "Soumission congé", detail: "Demande DC-2024-002 soumise — 10 jours", date: "05/09/2026", heure: "08:40", type: "default", ip: "192.168.2.102" },
  { id: 6, user: "OUATTARA Aya", role: "gestionnaire-rh", action: "Validation Gestionnaire RH", detail: "DC-2024-002 validée(s) par Gestionnaire RH — en cours", date: "06/09/2026", heure: "10:05", type: "success", ip: "192.168.1.30" },
  { id: 7, user: "AKPA Laurette", role: "agent", action: "Soumission congé", detail: "Demande DC-2024-003 soumise — 21 jours", date: "20/09/2026", heure: "08:55", type: "default", ip: "192.168.2.103" },
  { id: 8, user: "KONAN Yves", role: "sous-directeur", action: "Validation Sous Directeur", detail: "DC-2024-003 validée(s) par Sous Directeur — en cours", date: "21/09/2026", heure: "11:20", type: "success", ip: "192.168.1.31" },
  { id: 9, user: "N'GORAN Emmanuel", role: "agent", action: "Soumission congé", detail: "Demande DC-2024-004 soumise — 21 jours", date: "28/08/2026", heure: "09:05", type: "default", ip: "192.168.2.104" },
  { id: 10, user: "TOURÉ Mamadou", role: "agent", action: "Soumission congé", detail: "Demande DC-2024-005 soumise — 7 jours", date: "26/08/2026", heure: "08:20", type: "default", ip: "192.168.2.105" },
  { id: 11, user: "DIOMANDÉ Karim", role: "agent", action: "Soumission congé", detail: "Demande DC-2024-006 soumise — 1 jours", date: "27/08/2026", heure: "08:30", type: "default", ip: "192.168.2.106" },
  { id: 12, user: "YAO Marie-Claire", role: "drh", action: "Création décision", detail: "Décision DEC-2024-002 créée — 3 agent(s)", date: "24/08/2026", heure: "14:00", type: "info", ip: "192.168.1.22" },
  { id: 13, user: "YAO Marie-Claire", role: "drh", action: "Signature décision", detail: "Décision DEC-2024-002 signée et publiée", date: "25/08/2026", heure: "09:15", type: "success", ip: "192.168.1.22" },
];

export const STORAGE_PREFIX = "gnaa9:";

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function usePersistentState<T>(key: string, initial: T, merge?: (stored: T) => T) {
  const [state, setState] = useState<T>(() => {
    const loaded = loadStored(key, initial);
    return merge ? merge(loaded) : loaded;
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
    } catch {
      // storage unavailable — state stays in-memory for this session
    }
  }, [key, state]);
  return [state, setState] as const;
}

function mergeByMatricule<T extends { matricule: string }>(defaults: T[]) {
  return (stored: T[]) => {
    const existing = new Set(stored.map(item => item.matricule));
    const missing = defaults.filter(item => !existing.has(item.matricule));
    return missing.length ? [...stored, ...missing] : stored;
  };
}

function todayFr() {
  return new Date().toLocaleDateString("fr-FR");
}

function nowTimeFr() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function nextRef(prefix: string, list: { id: string }[]) {
  const max = list.reduce((m, item) => {
    const match = item.id.match(/(\d+)$/);
    const n = match ? parseInt(match[1], 10) : 0;
    return Math.max(m, n);
  }, 0);
  return `${prefix}-2024-${String(max + 1).padStart(3, "0")}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => loadStored<User | null>("currentUser", null));
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [users, setUsers] = usePersistentState<User[]>("users", DEFAULT_USERS, mergeByMatricule(DEFAULT_USERS));
  const [agents, setAgents] = usePersistentState<Agent[]>("agents", DEFAULT_AGENTS, mergeByMatricule(DEFAULT_AGENTS));
  const [conges, setConges] = usePersistentState<CongeRequest[]>("conges", DEFAULT_CONGES);
  const [permissions, setPermissions] = usePersistentState<PermissionRequest[]>("permissions", DEFAULT_PERMISSIONS);
  const [decisions, setDecisions] = usePersistentState<Decision[]>("decisions", DEFAULT_DECISIONS, stored => stored.filter(d => d.type === "Congé annuel"));
  const [actes, setActes] = usePersistentState<Acte[]>("actes", []);
  const [journal, setJournal] = usePersistentState<JournalEntry[]>("journal", DEFAULT_JOURNAL);
  const [notifications, setNotifications] = usePersistentState<AppNotification[]>("notifications", []);

  const setCurrentUser = (u: User | null, remember: boolean = true) => {
    setCurrentUserState(u);
    try {
      if (u && remember) localStorage.setItem(STORAGE_PREFIX + "currentUser", JSON.stringify(u));
      else localStorage.removeItem(STORAGE_PREFIX + "currentUser");
    } catch {
      // ignore storage errors
    }
  };

  const addJournalEntry: AppContextType["addJournalEntry"] = ({ action, detail, type = "default" }) => {
    setJournal(prev => [
      { id: (prev.reduce((m, j) => Math.max(m, j.id), 0) + 1), user: currentUser ? `${currentUser.nom} ${currentUser.prenom}` : "Système", role: currentUser?.role ?? "system", action, detail, date: todayFr(), heure: nowTimeFr(), type, ip: "127.0.0.1" },
      ...prev,
    ]);
  };

  const addNotification = (data: { title: string; detail: string; type?: JournalType; audience: NotificationAudience; matricule?: string; page?: string }) => {
    setNotifications(prev => [
      { id: (prev.reduce((m, n) => Math.max(m, n.id), 0) + 1), title: data.title, detail: data.detail, date: todayFr(), heure: nowTimeFr(), type: data.type ?? "default", audience: data.audience, matricule: data.matricule, page: data.page, read: false },
      ...prev,
    ]);
  };

  const markNotificationRead: AppContextType["markNotificationRead"] = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead: AppContextType["markAllNotificationsRead"] = (audience, matricule) => {
    setNotifications(prev => prev.map(n => {
      if (audience === "agent" ? (n.audience === "agent" && n.matricule === matricule) : n.audience === "actors") {
        return { ...n, read: true };
      }
      return n;
    }));
  };

  const addConge: AppContextType["addConge"] = (data) => {
    const record: CongeRequest = { id: nextRef("DC", conges), statut: "pending", soumis: todayFr(), urgence: data.urgence ?? false, ...data };
    setConges(prev => [record, ...prev]);
    addJournalEntry({ action: "Soumission congé", detail: `Demande ${record.id} soumise — ${record.duree} jours`, type: "default" });
    addNotification({
      title: "Nouvelle demande de congé",
      detail: `${record.agent} a soumis une demande de ${record.type} (${record.duree}j) — ${record.id}`,
      type: "default", audience: "actors", page: "conge-liste",
    });
    return record;
  };

  const decideConge: AppContextType["decideConge"] = (ids, action, motif) => {
    const affected = conges.filter(c => ids.includes(c.id));
    // Le Directeur est la dernière étape du circuit de validation (Gestionnaire RH →
    // Sous-Directeur → Directeur), mais ce n'est pas la validation finale de la demande :
    // celle-ci n'intervient qu'à la remise de l'acte de cessation signé par le DRH (cf.
    // signerActe). L'approbation du Directeur fait donc passer la demande au statut "info"
    // (validation du circuit terminée, en attente de l'acte), pas "success".
    const isDirecteur = currentUser?.role === "directeur" || currentUser?.role === "admin";
    const isIntermediate = action === "approve" && !isDirecteur;
    const newStatut: CongeStatut = action === "approve" ? (isIntermediate ? "warning" : "info") : "danger";
    const approverLabel = currentUser ? roleLabel(currentUser.role) : "";
    setConges(prev => prev.map(c => ids.includes(c.id) ? { ...c, statut: newStatut, motifRejet: action === "reject" ? motif : undefined } : c));
    addJournalEntry({
      action: action === "approve" ? (isIntermediate ? `Validation ${approverLabel}` : "Validation congé — Directeur") : "Rejet congé",
      detail: `${ids.join(", ")} ${action === "approve" ? (isIntermediate ? `validée(s) par ${approverLabel} — en cours` : "validée(s) par le Directeur — en attente de l'acte de cessation") : "rejetée(s)"}${motif ? ` — ${motif}` : ""}`,
      type: action === "approve" ? "success" : "danger",
    });
    affected.forEach(c => {
      addNotification({
        title: action === "approve" ? (isIntermediate ? "Congé en cours de traitement" : "Congé validé — en attente de l'acte") : "Congé rejeté",
        detail: action === "approve"
          ? (isIntermediate
            ? `Votre demande ${c.id} (${c.type}) a été validée par ${approverLabel} et est en cours de traitement`
            : `Votre demande ${c.id} (${c.type}) a été validée par le Directeur — l'acte de cessation reste à établir avant validation finale`)
          : `Votre demande ${c.id} (${c.type}) a été rejetée${motif ? ` — ${motif}` : ""}`,
        type: action === "approve" ? (isIntermediate ? "warning" : "info") : "danger",
        audience: "agent", matricule: c.matricule, page: "conge-liste",
      });
      if (isIntermediate) {
        addNotification({
          title: "Demande en attente de votre validation",
          detail: `${c.agent} — ${c.id} a été validée par ${approverLabel} et attend la décision du Directeur`,
          type: "info", audience: "actors", page: "conge-liste",
        });
      } else if (action === "approve") {
        addNotification({
          title: "Demande à imputer pour l'acte de cessation",
          detail: `${c.agent} — ${c.id} a été validée par le Directeur et attend votre imputation au Sous-Directeur DRH`,
          type: "info", audience: "actors", page: "conge-liste",
        });
      }
    });
  };

  const deleteConge: AppContextType["deleteConge"] = (id) => {
    const c = conges.find(c => c.id === id);
    setConges(prev => prev.filter(c => c.id !== id));
    addJournalEntry({ action: "Suppression congé", detail: `Demande ${id}${c ? ` (${c.agent})` : ""} supprimée`, type: "danger" });
  };

  const imputerConge: AppContextType["imputerConge"] = (id, collaborateurMatricule) => {
    const c = conges.find(c => c.id === id);
    const collaborateur = users.find(u => u.matricule === collaborateurMatricule);
    if (!c || !collaborateur) return;
    const nom = `${collaborateur.nom} ${collaborateur.prenom}`;
    setConges(prev => prev.map(x => x.id === id ? { ...x, imputeA: nom, imputeMatricule: collaborateur.matricule } : x));
    addJournalEntry({ action: "Imputation congé", detail: `${id} imputée à ${nom} pour traitement`, type: "info" });
    addNotification({
      title: "Demande imputée pour traitement",
      detail: `${c.agent} — ${c.id} vous a été imputée pour traitement par ${currentUser ? `${currentUser.nom} ${currentUser.prenom}` : "le DRH"}`,
      type: "info", audience: "actors", matricule: collaborateur.matricule, page: "conge-liste",
    });
  };

  // Le Sous-Directeur DRH impute à son tour la demande au Gestionnaire DRH : cette seconde
  // imputation crée l'acte de cessation, déjà rattaché aux deux acteurs désignés.
  const imputerCongeGDRH: AppContextType["imputerCongeGDRH"] = (id, collaborateurMatricule) => {
    const c = conges.find(c => c.id === id);
    const collaborateur = users.find(u => u.matricule === collaborateurMatricule);
    if (!c || !collaborateur || !c.imputeA) return;
    const nom = `${collaborateur.nom} ${collaborateur.prenom}`;
    setConges(prev => prev.map(x => x.id === id ? { ...x, imputeGDRH: nom, imputeGDRHMatricule: collaborateur.matricule } : x));
    addJournalEntry({ action: "Imputation congé", detail: `${id} imputée au Gestionnaire DRH (${nom}) pour production de l'acte de cessation`, type: "info" });
    setActes(prev => {
      const nextNum = prev.reduce((m, a) => Math.max(m, parseInt(a.id.match(/(\d+)$/)?.[1] ?? "0", 10)), 0) + 1;
      const record: Acte = {
        id: `ACT-2024-${String(nextNum).padStart(3, "0")}`,
        congeId: c.id, agent: c.agent, matricule: c.matricule, direction: c.direction,
        type: c.type, debut: c.debut, fin: c.fin, duree: c.duree,
        statut: "attente_production",
        sousDirecteurDrh: c.imputeA, sousDirecteurDrhMatricule: c.imputeMatricule,
        gestionnaireDrh: nom, gestionnaireDrhMatricule: collaborateur.matricule,
        dateCreation: todayFr(),
      };
      return [record, ...prev];
    });
    addJournalEntry({ action: "Création acte de cessation", detail: `Acte créé pour ${id} — imputé au Gestionnaire DRH (${nom})`, type: "info" });
    addNotification({
      title: "Acte de cessation à produire",
      detail: `La demande ${id} (${c.agent}) vous a été imputée pour la production de l'acte de cessation`,
      type: "info", audience: "actors", matricule: collaborateur.matricule, page: "conge-actes",
    });
  };

  const addPermission: AppContextType["addPermission"] = (data) => {
    const record: PermissionRequest = { id: nextRef("PM", permissions), statut: "pending", acte: false, ...data };
    setPermissions(prev => [record, ...prev]);
    addJournalEntry({ action: "Soumission permission", detail: `Demande ${record.id} soumise — ${data.motif}`, type: "default" });
    addNotification({
      title: "Nouvelle demande de permission",
      detail: `${record.agent} a soumis une demande de permission — ${record.id}`,
      type: "default", audience: "actors", page: "perm-validation",
    });
    return record;
  };

  const decidePermission: AppContextType["decidePermission"] = (ids, action, motif) => {
    const affected = permissions.filter(p => ids.includes(p.id));
    const role = currentUser?.role;
    const approverLabel = currentUser ? roleLabel(currentUser.role) : "";

    const nextStatutFor = (current: PermissionStatut): PermissionStatut | null => {
      if (current === "pending" && (role === "gestionnaire-rh" || role === "admin")) return "attente_sous_directeur";
      if (current === "attente_sous_directeur" && (role === "sous-directeur" || role === "admin")) return "attente_directeur";
      if (current === "attente_directeur" && (role === "directeur" || role === "admin")) return "attente_transmission_grh";
      return null;
    };

    setPermissions(prev => prev.map(p => {
      if (!ids.includes(p.id)) return p;
      if (action === "reject") return { ...p, statut: "danger", motifRejet: motif };
      const next = nextStatutFor(p.statut);
      return next ? { ...p, statut: next, motifRejet: undefined } : p;
    }));

    addJournalEntry({
      action: action === "approve" ? `Validation ${approverLabel}` : "Rejet permission",
      detail: `${ids.join(", ")} ${action === "approve" ? `validée(s) par ${approverLabel}` : "rejetée(s)"}${motif ? ` — ${motif}` : ""}`,
      type: action === "approve" ? "success" : "danger",
    });

    affected.forEach(p => {
      if (action === "reject") {
        addNotification({
          title: "Permission rejetée",
          detail: `Votre demande ${p.id} a été rejetée${motif ? ` — ${motif}` : ""}`,
          type: "danger", audience: "agent", matricule: p.matricule, page: "perm-liste",
        });
        return;
      }
      addNotification({
        title: "Permission en cours de traitement",
        detail: `Votre demande ${p.id} a été validée par ${approverLabel} et est en cours de traitement`,
        type: "info", audience: "agent", matricule: p.matricule, page: "perm-liste",
      });
      addNotification({
        title: "Demande de permission en attente de votre décision",
        detail: `${p.agent} — ${p.id} a été validée par ${approverLabel} et attend votre décision`,
        type: "info", audience: "actors", page: "perm-liste",
      });
    });
  };

  const transmettrePermission: AppContextType["transmettrePermission"] = (id) => {
    const p = permissions.find(x => x.id === id);
    if (!p) return;
    setPermissions(prev => prev.map(x => x.id === id ? { ...x, statut: "attente_acte" } : x));
    addJournalEntry({ action: "Transmission permission", detail: `${id} transmise au Gestionnaire RH pour établissement de l'acte`, type: "info" });
    addNotification({
      title: "Permission à établir",
      detail: `${p.agent} — ${p.id} a été validée par le Directeur et attend l'établissement de l'acte administratif`,
      type: "info", audience: "actors", page: "perm-liste",
    });
  };

  const creerActePermission: AppContextType["creerActePermission"] = (id) => {
    const p = permissions.find(x => x.id === id);
    if (!p) return;
    setPermissions(prev => prev.map(x => x.id === id ? { ...x, statut: "success", acte: true } : x));
    addJournalEntry({ action: "Création acte permission", detail: `Acte administratif créé pour la permission ${id}`, type: "success" });
    addNotification({
      title: "Votre demande a été validée",
      detail: `Votre demande de permission ${id} a été validée — l'acte administratif est disponible au téléchargement`,
      type: "success", audience: "agent", matricule: p.matricule, page: "perm-liste",
    });
  };

  const addUser: AppContextType["addUser"] = (data) => {
    const id = users.reduce((m, u) => Math.max(m, u.id), 0) + 1;
    const record: User = { id, ...data };
    setUsers(prev => [...prev, record]);
    addJournalEntry({ action: "Création utilisateur", detail: `Nouvel utilisateur ${record.prenom} ${record.nom} créé`, type: "info" });
    return record;
  };

  const updateUser: AppContextType["updateUser"] = (id, data) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    addJournalEntry({ action: "Modification utilisateur", detail: `Utilisateur #${id} modifié`, type: "info" });
  };

  const toggleUserActif: AppContextType["toggleUserActif"] = (id) => {
    const u = users.find(u => u.id === id);
    setUsers(prev => prev.map(x => x.id === id ? { ...x, actif: !(x.actif ?? true) } : x));
    addJournalEntry({ action: "Changement de statut", detail: `Statut de ${u?.prenom ?? ""} ${u?.nom ?? ""} modifié`, type: "warning" });
  };

  const deleteUser: AppContextType["deleteUser"] = (id) => {
    const u = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    addJournalEntry({ action: "Suppression utilisateur", detail: `Utilisateur ${u?.prenom ?? ""} ${u?.nom ?? ""} supprimé`, type: "danger" });
  };

  const resetUserPassword: AppContextType["resetUserPassword"] = (id) => {
    const u = users.find(u => u.id === id);
    addJournalEntry({ action: "Réinitialisation mot de passe", detail: `Mot de passe réinitialisé pour ${u?.prenom ?? ""} ${u?.nom ?? ""}`, type: "warning" });
  };

  const addAgent: AppContextType["addAgent"] = (data) => {
    const id = agents.reduce((m, a) => Math.max(m, a.id), 0) + 1;
    const record: Agent = { id, statut: "active", solde: 42, pris: 0, dateEmbauche: todayFr(), ...data };
    setAgents(prev => [...prev, record]);
    addJournalEntry({ action: "Création agent", detail: `Nouvel agent ${record.nom} ajouté`, type: "info" });
    return record;
  };

  const updateAgent: AppContextType["updateAgent"] = (id, data) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    const a = agents.find(a => a.id === id);
    addJournalEntry({ action: "Modification agent", detail: `Fiche de ${data.nom ?? a?.nom ?? ""} modifiée`, type: "info" });
  };

  const deleteAgent: AppContextType["deleteAgent"] = (id) => {
    const a = agents.find(a => a.id === id);
    setAgents(prev => prev.filter(a => a.id !== id));
    addJournalEntry({ action: "Suppression agent", detail: `Agent ${a?.nom ?? ""} supprimé`, type: "danger" });
  };

  const createDecision: AppContextType["createDecision"] = (data) => {
    const record: Decision = { id: nextRef("DEC", decisions), ref: data.agents.map(a => a.matricule).join(","), statut: "draft", dateCreation: todayFr(), ...data };
    setDecisions(prev => [record, ...prev]);
    addJournalEntry({ action: "Création décision", detail: `Décision ${record.id} créée — ${data.agents.length} agent(s)`, type: "info" });
    addNotification({
      title: "Nouvelle décision à signer",
      detail: `Décision ${record.id} créée — ${data.agents.length} agent(s) — en attente de signature`,
      type: "info", audience: "actors", page: "conge-decisions",
    });
    return record;
  };

  const signDecision: AppContextType["signDecision"] = (id) => {
    const decision = decisions.find(d => d.id === id);
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, statut: "signed", dateSignature: todayFr() } : d));
    addJournalEntry({ action: "Signature décision", detail: `Décision ${id} signée et publiée`, type: "success" });
    decision?.agents.forEach(a => {
      addNotification({
        title: "Décision signée",
        detail: `La décision ${id} (${decision.titre}) vous concernant a été signée et publiée`,
        type: "success", audience: "agent", matricule: a.matricule, page: "conge-liste",
      });
    });
  };

  const produireActe: AppContextType["produireActe"] = (acteId) => {
    setActes(prev => prev.map(a => a.id === acteId ? { ...a, statut: "attente_verification", dateProduction: todayFr() } : a));
    addJournalEntry({ action: "Production acte", detail: `Acte ${acteId} produit — transmis au Vérificateur RH`, type: "info" });
    addNotification({
      title: "Acte à vérifier",
      detail: `L'acte de cessation ${acteId} a été produit et attend votre vérification de conformité`,
      type: "info", audience: "actors", page: "conge-actes",
    });
  };

  const deciderVerificationActe: AppContextType["deciderVerificationActe"] = (acteId, action, motif) => {
    const acte = actes.find(a => a.id === acteId);
    if (!acte) return;
    if (action === "approve") {
      setActes(prev => prev.map(a => a.id === acteId ? { ...a, statut: "attente_transmission", dateVerification: todayFr(), motifRejet: undefined } : a));
      addJournalEntry({ action: "Vérification acte", detail: `Acte ${acteId} vérifié conforme par le Vérificateur RH`, type: "success" });
      addNotification({
        title: "Acte vérifié",
        detail: `L'acte ${acteId} a été vérifié conforme — transmettez-le au Sous-Directeur DRH`,
        type: "success", audience: "actors", matricule: acte.gestionnaireDrhMatricule, page: "conge-actes",
      });
    } else {
      setActes(prev => prev.map(a => a.id === acteId ? { ...a, statut: "attente_production", motifRejet: motif } : a));
      addJournalEntry({ action: "Rejet acte", detail: `Acte ${acteId} rejeté par le Vérificateur RH — ${motif ?? ""}`, type: "danger" });
      addNotification({
        title: "Acte rejeté par le Vérificateur RH",
        detail: `L'acte ${acteId} a été rejeté${motif ? ` — ${motif}` : ""} — merci de le corriger`,
        type: "danger", audience: "actors", matricule: acte.gestionnaireDrhMatricule, page: "conge-actes",
      });
    }
  };

  const transmettreActe: AppContextType["transmettreActe"] = (acteId) => {
    const acte = actes.find(a => a.id === acteId);
    setActes(prev => prev.map(a => a.id === acteId ? { ...a, statut: "attente_validation_sddrh" } : a));
    addJournalEntry({ action: "Transmission acte", detail: `Acte ${acteId} transmis au Sous-Directeur DRH pour validation`, type: "info" });
    addNotification({
      title: "Acte à valider",
      detail: `L'acte ${acteId}, vérifié conforme, attend votre validation`,
      type: "info", audience: "actors", matricule: acte?.sousDirecteurDrhMatricule, page: "conge-actes",
    });
  };

  const deciderValidationSDDRH: AppContextType["deciderValidationSDDRH"] = (acteId, action, motif) => {
    const acte = actes.find(a => a.id === acteId);
    if (!acte) return;
    if (action === "approve") {
      setActes(prev => prev.map(a => a.id === acteId ? { ...a, statut: "attente_signature", dateValidationSDDRH: todayFr(), motifRejet: undefined } : a));
      addJournalEntry({ action: "Validation acte", detail: `Acte ${acteId} validé par le Sous-Directeur DRH — en attente de signature`, type: "success" });
      addNotification({
        title: "Acte à signer",
        detail: `L'acte ${acteId} a été validé par le Sous-Directeur DRH et attend votre signature`,
        type: "info", audience: "actors", page: "conge-actes",
      });
    } else {
      setActes(prev => prev.map(a => a.id === acteId ? { ...a, statut: "attente_production", motifRejet: motif } : a));
      addJournalEntry({ action: "Rejet acte", detail: `Acte ${acteId} rejeté par le Sous-Directeur DRH — ${motif ?? ""}`, type: "danger" });
      addNotification({
        title: "Acte rejeté par le Sous-Directeur DRH",
        detail: `L'acte ${acteId} a été rejeté${motif ? ` — ${motif}` : ""} — merci de le corriger`,
        type: "danger", audience: "actors", matricule: acte.gestionnaireDrhMatricule, page: "conge-actes",
      });
    }
  };

  const signerActe: AppContextType["signerActe"] = (acteId, signatureDataUrl) => {
    const acte = actes.find(a => a.id === acteId);
    if (!acte) return;
    setActes(prev => prev.map(a => a.id === acteId ? { ...a, statut: "signe", dateSignature: todayFr(), signatureDataUrl } : a));
    // La signature de l'acte de cessation constitue la validation finale de la demande de congé.
    setConges(prev => prev.map(c => c.id === acte.congeId ? { ...c, statut: "success" } : c));
    addJournalEntry({ action: "Signature acte", detail: `Acte ${acteId} signé par le Directeur — demande ${acte.congeId} définitivement validée`, type: "success" });
    addNotification({
      title: "Votre demande a été validée",
      detail: `Votre acte de cessation ${acteId} (${acte.type}) a été signé — vous pouvez le télécharger`,
      type: "success", audience: "agent", matricule: acte.matricule, page: "conge-liste",
    });
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, currentPage, setCurrentPage, sidebarOpen, setSidebarOpen,
      users, agents, conges, permissions, decisions, actes, journal,
      notifications, markNotificationRead, markAllNotificationsRead,
      addConge, decideConge, deleteConge, imputerConge, imputerCongeGDRH, addPermission, decidePermission, transmettrePermission, creerActePermission,
      addUser, updateUser, toggleUserActif, deleteUser, resetUserPassword,
      addAgent, updateAgent, deleteAgent, createDecision, signDecision, addJournalEntry,
      produireActe, deciderVerificationActe, transmettreActe, deciderValidationSDDRH, signerActe,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
