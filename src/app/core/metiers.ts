/** Métiers proposés à l'inscription et dans les filtres (l'artisan peut aussi saisir le sien). */
export const METIERS = [
  'Plomberie',
  'Électricité',
  'Peinture',
  'Menuiserie',
  'Maçonnerie',
  'Climatisation',
  'Serrurerie',
  'Carrelage',
  'Jardinage',
  'Nettoyage',
] as const;

export const VILLES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan'];

/** Clés des catégories de la page d'accueil (/services/:key) vers le métier des annonces. */
export const SERVICE_KEY_TO_METIER: Record<string, string> = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  menuiserie: 'Menuiserie',
  peinture: 'Peinture',
  maconnerie: 'Maçonnerie',
  climatisation: 'Climatisation',
};
