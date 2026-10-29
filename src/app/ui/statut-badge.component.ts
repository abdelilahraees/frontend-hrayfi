import { Component, computed, input } from '@angular/core';
import { StatutDemande } from '../core/models';

export const STATUTS: Record<StatutDemande, { label: string; cls: string; dot: string }> = {
  EN_ATTENTE: { label: 'En attente', cls: 'bg-citron-50 text-[#7a5d00]', dot: 'bg-[#e9b800]' },
  ACCEPTEE: { label: 'Acceptée', cls: 'bg-menthe-50 text-menthe-deep', dot: 'bg-menthe' },
  REFUSEE: { label: 'Refusée', cls: 'bg-argile-50 text-[#9a3b22]', dot: 'bg-argile' },
  TERMINEE: { label: 'Terminée', cls: 'bg-encre/[0.06] text-encre', dot: 'bg-encre' },
};

@Component({
  selector: 'app-statut-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold" [class]="info().cls">
      <span class="size-1.5 rounded-full" [class]="info().dot"></span>{{ info().label }}
    </span>
  `,
})
export class StatutBadgeComponent {
  readonly statut = input.required<StatutDemande>();
  protected readonly info = computed(() => STATUTS[this.statut()]);
}
