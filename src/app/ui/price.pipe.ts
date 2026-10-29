import { Pipe, PipeTransform } from '@angular/core';

const fmt = new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 });

/** Fourchette de prix d'une annonce : "150 – 600 MAD", "À partir de 150 MAD", "Prix sur devis". */
@Pipe({ name: 'price', standalone: true })
export class PricePipe implements PipeTransform {
  transform(v: { prixMin: number | null; prixMax: number | null } | number | null | undefined): string {
    if (v === null || v === undefined) return 'Prix sur devis';
    if (typeof v === 'number') return `${fmt.format(v)} MAD`;
    const { prixMin: min, prixMax: max } = v;
    if (min != null && max != null) return min === max ? `${fmt.format(min)} MAD` : `${fmt.format(min)} – ${fmt.format(max)} MAD`;
    if (min != null) return `À partir de ${fmt.format(min)} MAD`;
    if (max != null) return `Jusqu'à ${fmt.format(max)} MAD`;
    return 'Prix sur devis';
  }
}
