import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type FaqItem = {
  question: string;
  answer: string;
};

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './faq.component.html',
})
export class FaqComponent {
  protected readonly openIndex = signal<number | null>(0);

  protected readonly items: FaqItem[] = [
    {
      question: 'Comment fonctionne Hrayfi ?',
      answer:
        "Décrivez votre projet en 2 minutes, recevez plusieurs devis d'artisans vérifiés en 24h, échangez via la messagerie et choisissez le professionnel qui vous convient. Vous ne payez qu'une fois la prestation réalisée.",
    },
    {
      question: 'Est-ce que publier un projet est gratuit ?',
      answer:
        "Oui, publier un projet et recevoir des devis est 100% gratuit pour les particuliers. Nous ne prélevons aucune commission sur votre devis. Hrayfi se rémunère uniquement auprès des artisans via un abonnement mensuel.",
    },
    {
      question: 'Comment sont vérifiés les artisans ?',
      answer:
        "Chaque artisan doit fournir sa carte d'identité, son numéro CNSS/RC, ses attestations professionnelles et ses polices d'assurance. Nous vérifions également les avis clients et effectuons un contrôle qualité continu.",
    },
    {
      question: 'Puis-je annuler une réservation ?',
      answer:
        "Oui, vous pouvez annuler gratuitement jusqu'à 24h avant l'intervention. Au-delà, des frais peuvent s'appliquer selon les conditions de l'artisan. Toutes les conditions sont transparentes avant la validation.",
    },
    {
      question: 'Quels modes de paiement sont acceptés ?',
      answer:
        "Vous pouvez payer directement l'artisan en espèces, par chèque ou par virement bancaire. Le paiement en ligne sécurisé via carte bancaire sera disponible prochainement sur la plateforme.",
    },
    {
      question: 'Quelle garantie sur les travaux ?',
      answer:
        "Tous les artisans Hrayfi sont assurés en responsabilité civile professionnelle. Pour les travaux de construction, la garantie décennale s'applique conformément à la législation marocaine. En cas de litige, notre équipe médiation vous accompagne.",
    },
    {
      question: 'Je suis artisan, comment m\'inscrire ?',
      answer:
        "Rendez-vous sur la page « Devenir artisan », créez votre profil, téléchargez vos documents justificatifs et complétez votre portfolio. Notre équipe valide votre dossier sous 48h et vous recevez vos premières demandes immédiatement.",
    },
  ];

  toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? null : index));
  }
}
