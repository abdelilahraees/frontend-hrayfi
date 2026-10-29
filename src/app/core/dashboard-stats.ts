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
