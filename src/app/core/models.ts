export type Role = 'CLIENT' | 'ARTISAN' | 'ADMIN';
export type Disponibilite = 'DISPONIBLE' | 'OCCUPE' | 'INDISPONIBLE';
export type StatutDemande = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'TERMINEE';
/** Validation d'un compte artisan par un administrateur */
export type StatutValidation = 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'SUSPENDU';

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
  /** null après l'inscription d'un artisan : le compte attend la validation d'un administrateur */
  accessToken: string | null;
  tokenType: string;
  expiresInMs: number;
  userId: number;
  email: string;
  role: Role;
  statutValidation: StatutValidation | null;
}

export interface Me {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  telephone: string | null;
  createdAt: string;
  adresse: string | null;
  preferences: string | null;
  metier: string | null;
  tarifHoraire: number | null;
  description: string | null;
  ville: string | null;
  disponibilite: Disponibilite | null;
  latitude: number | null;
  longitude: number | null;
  /** true : centre de la ville, pas encore précisé sur la carte */
  positionApprox: boolean | null;
}

export interface RegisterClient {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  adresse?: string;
}

export interface RegisterArtisan {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  metier: string;
  telephone: string;
  ville?: string;
  tarifHoraire?: number | null;
  description?: string;
}

export type UpdateProfile = Partial<
  Pick<Me, 'nom' | 'prenom' | 'telephone' | 'adresse' | 'preferences' | 'metier' | 'tarifHoraire' | 'description' | 'ville' | 'disponibilite' | 'latitude' | 'longitude'>
>;

/** Artisan trouvé autour d'une position (recherche sur la carte) */
export interface ArtisanProche {
  artisan: ArtisanPublic;
  latitude: number;
  longitude: number;
  positionApprox: boolean;
  distanceKm: number;
  misEnAvant: boolean;
}

export interface VilleCoord {
  nom: string;
  latitude: number;
  longitude: number;
}

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
  /** Mise en avant payée en cours */
  sponsorisee: boolean;
  sponsoriseJusquAu: string | null;
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
  /** L'auteur a eu une intervention terminée avec cet artisan */
  verifie: boolean;
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

// ---------- Administration ----------

export interface AdminStats {
  clients: number;
  artisans: number;
  artisansParStatut: Record<StatutValidation, number>;
  annonces: number;
  annoncesEnLigne: number;
  demandes: number;
  demandesParStatut: Record<StatutDemande, number>;
  avis: number;
  noteMoyenne: number;
  volumeAffaires: number;
  revenusMois: number;
  revenusTotal: number;
  prosPayants: number;
  prosOfferts: number;
  aRelancer: number;
  annoncesMisesEnAvant: number;
  revenusParMois: { annee: number; mois: number; total: number }[];
}

// ---------- Offre Pro et paiements (encaissés hors ligne) ----------

export type StatutPro = 'AUCUN' | 'OFFERT' | 'PAYE' | 'EXPIRE';
export type ObjetPaiement = 'ABONNEMENT_PRO' | 'MISE_EN_AVANT';
export type MoyenPaiement = 'CASHPLUS' | 'WAFACASH' | 'VIREMENT' | 'ESPECES' | 'AUTRE';
export type FiltreCompte = 'TOUS' | 'A_RELANCER' | 'PAYES' | 'OFFERTS' | 'EXPIRES';

export interface Paiement {
  id: number;
  objet: ObjetPaiement;
  montant: number;
  moyen: MoyenPaiement;
  reference: string | null;
  dureeJours: number;
  annonceId: number | null;
  annonceTitre: string | null;
  note: string | null;
  enregistrePar: string | null;
  createdAt: string;
}

export interface AdminCompte {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  metier: string;
  ville: string | null;
  statutPro: StatutPro;
  proJusquAu: string | null;
  proOffert: boolean;
  totalPaye: number;
  nbAnnonces: number;
  annoncesMisesEnAvant: number;
  noteAdmin: string | null;
  createdAt: string;
}

export interface AdminCompteDetail {
  compte: AdminCompte;
  paiements: Paiement[];
  annonces: { id: number; titre: string; active: boolean; sponsoriseJusquAu: string | null }[];
}

export interface EnregistrerPaiement {
  objet: ObjetPaiement;
  montant: number;
  moyen: MoyenPaiement;
  reference?: string;
  dureeJours: number;
  annonceId?: number | null;
  note?: string;
}

export interface Offre {
  statutPro: StatutPro;
  proJusquAu: string | null;
  proOffert: boolean;
  misesEnAvant: { id: number; titre: string; jusquAu: string }[];
  paiements: Paiement[];
}

export interface AdminArtisan {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  metier: string;
  ville: string | null;
  tarifHoraire: number | null;
  description: string | null;
  createdAt: string;
  statutValidation: StatutValidation;
  motifRefus: string | null;
  valideLe: string | null;
  nbAnnonces: number;
}

export interface AdminUser {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  createdAt: string;
  statutValidation: StatutValidation | null;
}
