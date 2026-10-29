import { Component, computed, input } from '@angular/core';
import { StatutDemande } from '../core/models';

const STATUTS: Record<StatutDemande, { label: string; cls: string }> = {
  EN_ATTENTE: { label: 'En attente', cls: 'bg-citron-50 border-[#e9b800]' },
  ACCEPTEE: { label: 'Acceptée', cls: 'bg-menthe-50 border-menthe text-menthe-deep' },
  REFUSEE: { label: 'Refusée', cls: 'bg-argile-50 border-argile' },
  TERMINEE: { label: 'Terminée', cls: 'bg-encre text-white border-encre' },
};

@Component({
  selector: 'app-statut-badge',
  standalone: true,
  template: `<span class="inline-block rounded-full border-2 px-3 py-0.5 text-sm font-bold" [class]="info().cls">{{ info().label }}</span>`,
})
export class StatutBadgeComponent {
  readonly statut = input.required<StatutDemande>();
  protected readonly info = computed(() => STATUTS[this.statut()]);
}
