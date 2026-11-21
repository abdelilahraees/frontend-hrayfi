import { Component, ElementRef, afterNextRender, booleanAttribute, effect, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';

export interface MarqueurCarte {
  id: number;
  lat: number;
  lng: number;
  /** Infobulle au survol */
  label: string;
  /** Texte dans la pastille (initiales) */
  initiales: string;
  /** Position au centre de la ville : pastille en pointillés */
  approx?: boolean;
}

/**
 * Tuiles OpenStreetMap standard (sans clé). Pour la production à fort trafic, la politique d'usage d'OSM
 * demande un fournisseur dédié (MapTiler, Stadia…) : il suffira de changer cette URL.
 */
const TUILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const MAROC: L.LatLngExpression = [31.8, -7.1];

/**
 * Carte Leaflet : marqueurs d'artisans, position du visiteur avec cercle de recherche,
 * et mode « choix de position » (clic sur la carte) pour le profil artisan.
 */
@Component({
  selector: 'app-carte',
  standalone: true,
  host: { class: 'block relative isolate' },
  template: `<div #carte class="h-full w-full" role="application" [attr.aria-label]="ariaLabel()"></div>`,
})
export class CarteComponent {
  private readonly el = viewChild.required<ElementRef<HTMLDivElement>>('carte');

  readonly marqueurs = input<MarqueurCarte[]>([]);
  readonly selection = input<number | null>(null);
  /** Position du visiteur (ou point choisi) */
  readonly position = input<[number, number] | null>(null);
  readonly rayonKm = input<number | null>(null);
  /** Mode choix de position : un clic sur la carte émet `choix` */
  readonly editable = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('Carte des artisans');

  readonly marqueurClic = output<number>();
  readonly choix = output<[number, number]>();

  private map?: L.Map;
  private readonly calqueMarqueurs = L.layerGroup();
  private readonly calquePosition = L.layerGroup();
  private readonly parId = new Map<number, L.Marker>();
  /** Recadrer seulement quand les résultats ou la position changent, pas à chaque sélection */
  private derniereEmprise = '';

  constructor() {
    afterNextRender(() => {
      this.map = L.map(this.el().nativeElement, { zoomControl: true, attributionControl: true }).setView(MAROC, 6);
      L.tileLayer(TUILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(this.map);
      this.calqueMarqueurs.addTo(this.map);
      this.calquePosition.addTo(this.map);
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        if (this.editable()) this.choix.emit([e.latlng.lat, e.latlng.lng]);
      });
      this.dessiner();
      // La carte peut naître dans un conteneur qui change encore de taille
      setTimeout(() => this.map?.invalidateSize(), 200);
    });

    effect(() => {
      this.marqueurs();
      this.position();
      this.rayonKm();
      this.selection();
      this.dessiner();
    });
  }

  private dessiner() {
    const map = this.map;
    if (!map) return;
    const pos = this.position();
    const rayon = this.rayonKm();
    const sel = this.selection();

    // Position du visiteur et rayon de recherche
    this.calquePosition.clearLayers();
    if (pos) {
      if (rayon) {
        L.circle(pos, { radius: rayon * 1000, color: '#0b4f40', weight: 1, fillColor: '#1f7a63', fillOpacity: 0.05, interactive: false })
          .addTo(this.calquePosition);
      }
      L.marker(pos, {
        icon: L.divIcon({ className: '', html: '<span class="carte-moi"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
        keyboard: false,
        zIndexOffset: 1000,
      }).bindTooltip(this.editable() ? 'Position choisie' : 'Vous êtes ici', { direction: 'top', offset: [0, -10] })
        .addTo(this.calquePosition);
    }

    // Artisans
    this.calqueMarqueurs.clearLayers();
    this.parId.clear();
    for (const m of this.marqueurs()) {
      const actif = m.id === sel;
      const marker = L.marker([m.lat, m.lng], {
        icon: L.divIcon({
          className: '',
          html: `<span class="carte-pin${actif ? ' carte-pin--actif' : ''}${m.approx ? ' carte-pin--approx' : ''}">${escape(m.initiales)}</span>`,
          iconSize: actif ? [44, 44] : [34, 34],
          iconAnchor: actif ? [22, 22] : [17, 17],
        }),
        title: m.label,
        alt: m.label,
        zIndexOffset: actif ? 900 : 0,
      })
        .bindTooltip(escape(m.label), { direction: 'top', offset: [0, actif ? -22 : -17] })
        .on('click', () => this.marqueurClic.emit(m.id));
      marker.addTo(this.calqueMarqueurs);
      this.parId.set(m.id, marker);
    }

    // Cadrage : sur la sélection, sinon sur l'ensemble position + résultats
    const emprise = JSON.stringify([pos, rayon, this.marqueurs().map((m) => m.id)]);
    if (sel != null && this.parId.has(sel)) {
      map.flyTo(this.parId.get(sel)!.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 });
    } else if (emprise !== this.derniereEmprise) {
      const points: L.LatLngExpression[] = this.marqueurs().map((m) => [m.lat, m.lng] as [number, number]);
      if (pos) points.push(pos);
      if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
      else if (points.length === 1) map.setView(points[0], 13);
    }
    this.derniereEmprise = emprise;
  }
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
