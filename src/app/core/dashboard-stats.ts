import { Demande, StatutDemande } from './models';

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
