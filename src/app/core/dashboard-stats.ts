import { Annonce, Demande, Me, StatutDemande } from './models';

export interface MonthTotal {
  /** Libellé court du mois : "janv.", "févr."… */
  label: string;
  total: number;
  current: boolean;
}

const MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

/** Montant final des interventions terminées, regroupé par mois d'intervention (les `months` derniers mois). */
export function monthlyTotals(demandes: Demande[], months = 6): MonthTotal[] {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return { key: d.getFullYear() * 12 + d.getMonth(), label: MONTH.format(d), total: 0, current: i === months - 1 };
  });
  for (const d of demandes) {
    if (d.statut !== 'TERMINEE' || d.prixFinal == null) continue;
    const date = new Date(d.dateIntervention);
    const bucket = buckets.find((b) => b.key === date.getFullYear() * 12 + date.getMonth());
    if (bucket) bucket.total += d.prixFinal;
  }
  return buckets.map(({ label, total, current }) => ({ label, total, current }));
}

export function countByStatut(demandes: Demande[]): Record<StatutDemande, number> {
  const counts: Record<StatutDemande, number> = { EN_ATTENTE: 0, ACCEPTEE: 0, REFUSEE: 0, TERMINEE: 0 };
  for (const d of demandes) counts[d.statut]++;
  return counts;
}

/** Interventions acceptées à venir, de la plus proche à la plus lointaine. */
export function upcoming(demandes: Demande[], limit = 5): Demande[] {
  const now = Date.now();
  return demandes
    .filter((d) => d.statut === 'ACCEPTEE' && new Date(d.dateIntervention).getTime() >= now)
    .sort((a, b) => a.dateIntervention.localeCompare(b.dateIntervention))
    .slice(0, limit);
}

/** Variation en % du montant terminé entre le mois en cours et le précédent (null si le mois précédent est à 0). */
export function monthTrend(demandes: Demande[]): number | null {
  const [prev, cur] = monthlyTotals(demandes, 2);
  return prev!.total ? ((cur!.total - prev!.total) / prev!.total) * 100 : null;
}

export type TriDemandes = 'recentes' | 'intervention' | 'montant';

/** Montant affiché pour une demande : final s'il existe, sinon celui convenu. */
export function montant(d: Demande): number | null {
  return d.prixFinal ?? d.prixConvenu;
}

/** Recherche plein texte (interlocuteur, annonce, description) puis tri. */
export function searchDemandes(demandes: Demande[], q: string, tri: TriDemandes, interlocuteur: 'client' | 'artisan'): Demande[] {
  const needle = q.trim().toLocaleLowerCase('fr');
  const list = needle
    ? demandes.filter((d) =>
        [interlocuteur === 'client' ? d.clientNomComplet : d.artisanNomComplet, d.annonceTitre, d.description]
          .some((v) => v?.toLocaleLowerCase('fr').includes(needle)),
      )
    : [...demandes];
  switch (tri) {
    case 'intervention': return list.sort((a, b) => b.dateIntervention.localeCompare(a.dateIntervention));
    case 'montant': return list.sort((a, b) => (montant(b) ?? -1) - (montant(a) ?? -1));
    default: return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

const STATUT_CSV: Record<StatutDemande, string> = { EN_ATTENTE: 'En attente', ACCEPTEE: 'Acceptée', REFUSEE: 'Refusée', TERMINEE: 'Terminée' };

/** Télécharge les demandes au format CSV (séparateur ";" et BOM pour qu'Excel FR l'ouvre correctement). */
export function downloadCsv(demandes: Demande[], filename: string) {
  const cell = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const rows = [
    ['N°', 'Créée le', 'Intervention', 'Client', 'Artisan', 'Annonce', 'Description', 'Statut', 'Prix convenu (MAD)', 'Prix final (MAD)'],
    ...demandes.map((d) => [
      d.id, d.createdAt.slice(0, 10), d.dateIntervention.slice(0, 16).replace('T', ' '), d.clientNomComplet, d.artisanNomComplet,
      d.annonceTitre, d.description, STATUT_CSV[d.statut], d.prixConvenu, d.prixFinal,
    ]),
  ];
  const blob = new Blob(['﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Salutation selon l'heure, en arabe et en français. */
export function salutation(date = new Date()): { ar: string; fr: string } {
  return date.getHours() < 17 ? { ar: 'صباح الخير', fr: 'Bonjour' } : { ar: 'مساء الخير', fr: 'Bonsoir' };
}

export interface JourAgenda {
  date: Date;
  today: boolean;
  demandes: Demande[];
}

/** Les 7 jours à partir d'aujourd'hui, avec les interventions acceptées prévues ce jour-là. */
export function semaine(demandes: Demande[], from = new Date()): JourAgenda[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const jour = demandes
      .filter((d) => d.statut === 'ACCEPTEE' && sameDay(new Date(d.dateIntervention), date))
      .sort((a, b) => a.dateIntervention.localeCompare(b.dateIntervention));
    return { date, today: i === 0, demandes: jour };
  });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export interface CritereProfil {
  label: string;
  ok: boolean;
  /** Lien pour corriger le point manquant */
  link: string;
  queryParams?: Record<string, string>;
}

/** Points qui rendent un profil d'artisan convaincant, et score sur 100. */
export function qualiteProfil(me: Me | null, annonces: Annonce[]): { score: number; criteres: CritereProfil[] } {
  const actives = annonces.filter((a) => a.active);
  const criteres: CritereProfil[] = [
    { label: 'Présentation rédigée', ok: (me?.description?.trim().length ?? 0) >= 40, link: '/espace/profil' },
    { label: 'Ville et tarif horaire renseignés', ok: !!me?.ville && me?.tarifHoraire != null, link: '/espace/profil' },
    { label: 'Au moins une annonce en ligne', ok: actives.length > 0, link: '/espace/artisan/annonces/nouvelle' },
    { label: '3 photos ou plus sur une annonce', ok: annonces.some((a) => a.images.length >= 3), link: '/espace/artisan', queryParams: { onglet: 'annonces' } },
    { label: 'Premier avis client reçu', ok: annonces.some((a) => a.nbAvis > 0), link: '/espace/artisan', queryParams: { onglet: 'demandes' } },
  ];
  return { score: Math.round((criteres.filter((c) => c.ok).length / criteres.length) * 100), criteres };
}

/** Étape atteinte par une demande côté client : 0 envoyée, 1 acceptée, 2 terminée, 3 évaluée. Refusée : -1. */
export function etapeDemande(d: Demande, evaluee: boolean): number {
  if (d.statut === 'REFUSEE') return -1;
  if (d.statut === 'EN_ATTENTE') return 0;
  if (d.statut === 'ACCEPTEE') return 1;
  return evaluee ? 3 : 2;
}

export interface ArtisanConnu {
  id: number;
  nom: string;
  annonceId: number | null;
  interventions: number;
  derniere: string;
}

/** Artisans avec qui le client a déjà travaillé ou échangé une demande, du plus récent au plus ancien. */
export function mesArtisans(demandes: Demande[]): ArtisanConnu[] {
  const map = new Map<number, ArtisanConnu>();
  for (const d of demandes) {
    const a = map.get(d.artisanId) ?? { id: d.artisanId, nom: d.artisanNomComplet, annonceId: d.annonceId, interventions: 0, derniere: d.dateIntervention };
    if (d.statut === 'TERMINEE') a.interventions++;
    if (d.dateIntervention > a.derniere) a.derniere = d.dateIntervention;
    map.set(d.artisanId, a);
  }
  return [...map.values()].sort((a, b) => b.derniere.localeCompare(a.derniere));
}
