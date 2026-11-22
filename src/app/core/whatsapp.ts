/**
 * Numéro WhatsApp de l'équipe Hrayfi, que les artisans contactent pour payer leur offre Pro
 * ou une mise en avant (CashPlus, Wafacash, virement). À remplacer par le vrai numéro de l'équipe.
 */
export const HRAYFI_WHATSAPP = '+212600000000';

/** Tarifs indicatifs affichés aux artisans (encaissement hors ligne par l'équipe) */
export const TARIFS = {
  proMois: 149,
  proTrimestre: 399,
  miseEnAvant14j: 49,
};

/** Lien « click to chat » WhatsApp avec un message prérempli */
export function lienWhatsApp(telephone: string, message: string): string {
  return `https://wa.me/${telephone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

/** +212612345678 → 06 12 34 56 78 */
export function telephoneLisible(tel: string | null | undefined): string {
  if (!tel) return '';
  const local = tel.startsWith('+212') ? '0' + tel.slice(4) : tel;
  return local.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}
