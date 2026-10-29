export type Role = 'CLIENT' | 'ARTISAN' | 'ADMIN';
export type Disponibilite = 'DISPONIBLE' | 'OCCUPE' | 'INDISPONIBLE';
export type StatutDemande = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'TERMINEE';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  violations?: { field: string; message: string }[];
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  userId: number;
  email: string;
  role: Role;
}

export interface Me {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  createdAt: string;
  adresse: string | null;
  preferences: string | null;
  metier: string | null;
  tarifHoraire: number | null;
  description: string | null;
  ville: string | null;
  disponibilite: Disponibilite | null;
}

export interface RegisterClient {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  adresse?: string;
}

export interface RegisterArtisan {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  metier: string;
  ville?: string;
  tarifHoraire?: number | null;
  description?: string;
}

export type UpdateProfile = Partial<
  Pick<Me, 'nom' | 'prenom' | 'adresse' | 'preferences' | 'metier' | 'tarifHoraire' | 'description' | 'ville' | 'disponibilite'>
>;

export interface AnnonceImage {
  id: number;
  url: string;
}

export interface Annonce {
  id: number;
  artisanId: number;
  artisanNomComplet: string;
  titre: string;
  description: string;
  metier: string;
  ville: string | null;
  prixMin: number | null;
  prixMax: number | null;
  active: boolean;
  noteMoyenne: number;
  nbAvis: number;
  images: AnnonceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface AnnonceRequest {
  titre: string;
  description: string;
  metier?: string;
  ville?: string;
  prixMin?: number | null;
  prixMax?: number | null;
}

export interface AnnonceSearch {
  q?: string;
  metier?: string;
  ville?: string;
  noteMin?: number | null;
  prixMax?: number | null;
  sort?: string;
  page?: number;
  size?: number;
}

export interface MetierCount {
  metier: string;
  nbAnnonces: number;
}

export interface Avis {
  id: number;
  annonceId: number;
  annonceTitre: string;
  clientId: number;
  clientNomComplet: string;
  note: number;
  commentaire: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtisanPublic {
  id: number;
  nom: string;
  prenom: string;
  metier: string;
  tarifHoraire: number | null;
  description: string | null;
  ville: string | null;
  disponibilite: Disponibilite;
  noteMoyenne: number;
  nbAvis: number;
  nbAnnonces: number;
  createdAt: string;
}

export interface Demande {
  id: number;
  clientId: number;
  clientNomComplet: string;
  artisanId: number;
  artisanNomComplet: string;
  description: string;
  dateIntervention: string;
  statut: StatutDemande;
  prixFinal: number | null;
  annonceId: number | null;
  annonceTitre: string | null;
  prixConvenu: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDemande {
  artisanId: number;
  description: string;
  dateIntervention: string;
  annonceId?: number | null;
  prixConvenu?: number | null;
}

export interface Message {
  id: number;
  expediteurId: number;
  destinataireId: number;
  contenu: string;
  timestamp: string;
  annonceId: number | null;
  annonceTitre: string | null;
  prixPropose: number | null;
  lu: boolean;
}

export interface SendMessage {
  destinataireId: number;
  contenu: string;
  annonceId?: number | null;
  prixPropose?: number | null;
}

export interface Conversation {
  interlocuteurId: number;
  interlocuteurNomComplet: string;
  interlocuteurRole: Role;
  interlocuteurMetier: string | null;
  dernierMessage: string;
  dernierExpediteurId: number;
  dernierPrixPropose: number | null;
  dernierTimestamp: string;
  nonLus: number;
}

export interface AppNotification {
  id: number;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  lienCible: string | null;
  createdAt: string;
}

export interface ArtisanDashboard {
  demandesEnAttente: number;
  demandesAcceptees: number;
  demandesTermineesCeMois: number;
  chiffreAffairesCeMois: number;
  noteMoyenne: number;
  nbEvaluations: number;
  tauxAcceptation: number;
  nbAnnonces: number;
  nbAnnoncesActives: number;
  noteMoyenneAnnonces: number;
  nbAvisAnnonces: number;
  prochainesInterventions: Demande[];
}

export interface ClientDashboard {
  demandesEnAttente: number;
  demandesAcceptees: number;
  demandesTermineesTotal: number;
  totalDepense: number;
  nbAvisDonnes: number;
  dernieresDemandes: Demande[];
}
