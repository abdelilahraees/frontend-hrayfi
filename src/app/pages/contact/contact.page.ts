import { Component, ElementRef, Injector, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { StickerComponent, StickerName } from '../../ui/sticker.component';
import { SuccessPopComponent } from '../../ui/success-pop.component';

const CONTACT_EMAIL = 'contact@hrayfi.ma';
const WHATSAPP_NUMBER = '212522000000';
const MESSAGE_MAX = 1000;
// Moroccan numbers: 06/07/05… or +212 6/7/5…, spaces and dashes allowed
const MA_PHONE = /^(?:\+212|00212|0)[5-7](?:[\s.-]?\d){8}$/;

type Role = 'particulier' | 'artisan';
type Channel = 'email' | 'phone' | 'whatsapp';

const SUBJECTS: Record<Role, { value: string; needsDetails: boolean }[]> = {
  particulier: [
    { value: 'Trouver un artisan pour un projet', needsDetails: true },
    { value: 'Suivi d’un projet en cours', needsDetails: false },
    { value: 'Problème avec un artisan', needsDetails: false },
    { value: 'Autre question', needsDetails: false },
  ],
  artisan: [
    { value: 'Inscrire mon activité', needsDetails: true },
    { value: 'Mon compte et mes devis', needsDetails: false },
    { value: 'Abonnement et facturation', needsDetails: false },
    { value: 'Autre question', needsDetails: false },
  ],
};

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgTemplateOutlet, StickerComponent, SuccessPopComponent],
  templateUrl: './contact.page.html',
})
export class ContactPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly email = CONTACT_EMAIL;
  protected readonly messageMax = MESSAGE_MAX;
  protected readonly trades: { label: string; sticker: StickerName }[] = [
    { label: 'Plomberie', sticker: 'wrench' },
    { label: 'Électricité', sticker: 'bolt' },
    { label: 'Menuiserie', sticker: 'saw' },
    { label: 'Peinture', sticker: 'roller' },
    { label: 'Maçonnerie', sticker: 'bricks' },
    { label: 'Climatisation', sticker: 'snow' },
  ];
  protected readonly cities = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan'];
  protected readonly timings = ['Urgent, sous 48 h', 'Dans le mois', 'Je me renseigne'];
  protected readonly channels: { value: Channel; label: string }[] = [
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'whatsapp', label: 'WhatsApp' },
  ];

  protected readonly form = this.fb.group({
    role: this.fb.control<Role>('particulier'),
    subject: this.fb.control(SUBJECTS.particulier[0].value),
    trade: this.fb.control('', Validators.required),
    city: this.fb.control('', Validators.required),
    timing: this.fb.control(this.timings[1]),
    name: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    channel: this.fb.control<Channel>('email'),
    reply: this.fb.control('', [Validators.required, Validators.email]),
    message: this.fb.control('', [Validators.required, Validators.minLength(20), Validators.maxLength(MESSAGE_MAX)]),
  });

  private readonly c = this.form.controls;
  protected readonly role = toSignal(this.c.role.valueChanges, { initialValue: this.c.role.value });
  protected readonly subject = toSignal(this.c.subject.valueChanges, { initialValue: this.c.subject.value });
  protected readonly channel = toSignal(this.c.channel.valueChanges, { initialValue: this.c.channel.value });
  protected readonly message = toSignal(this.c.message.valueChanges, { initialValue: '' });

  protected readonly subjects = computed(() => SUBJECTS[this.role()]);
  protected readonly needsDetails = computed(
    () => this.subjects().find((s) => s.value === this.subject())?.needsDetails ?? false,
  );

  protected readonly submitted = signal(false);
  protected readonly sentVia = signal<'email' | 'whatsapp' | null>(null);
  protected readonly openNow = isOfficeOpen();
  protected readonly copied = signal<'phone' | 'email' | null>(null);
  private copiedTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Switching role picks that role's first subject
    effect(() => this.c.subject.setValue(SUBJECTS[this.role()][0].value));

    // Trade / city / timing only matter for a new project or an artisan sign-up
    effect(() => {
      const on = this.needsDetails();
      for (const ctrl of [this.c.trade, this.c.city, this.c.timing]) {
        on ? ctrl.enable({ emitEvent: false }) : ctrl.disable({ emitEvent: false });
      }
    });

    // The reply field follows the chosen channel
    effect(() => {
      const isEmail = this.channel() === 'email';
      this.c.reply.setValidators([Validators.required, isEmail ? Validators.email : Validators.pattern(MA_PHONE)]);
      this.c.reply.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected readonly replyField = computed(() =>
    this.channel() === 'email'
      ? { label: 'Votre e-mail', type: 'email', autocomplete: 'email', placeholder: 'nom@exemple.ma' }
      : {
          label: this.channel() === 'whatsapp' ? 'Votre numéro WhatsApp' : 'Votre numéro de téléphone',
          type: 'tel',
          autocomplete: 'tel',
          placeholder: '06 12 34 56 78',
        },
  );

  protected readonly messagePlaceholder = computed(() =>
    this.needsDetails() && this.role() === 'particulier'
      ? 'Ex. : fuite sous l’évier de la cuisine, l’eau coule en continu depuis hier soir.'
      : this.role() === 'artisan'
        ? 'Présentez votre activité en quelques lignes : années d’expérience, zone d’intervention…'
        : 'Expliquez-nous votre demande, avec le numéro de projet si vous en avez un.',
  );

  protected showError(name: keyof typeof this.form.controls): boolean {
    const ctrl = this.c[name];
    return ctrl.enabled && ctrl.invalid && (ctrl.touched || this.submitted());
  }

  protected errorFor(name: 'trade' | 'city' | 'name' | 'reply' | 'message'): string {
    const errors = this.c[name].errors ?? {};
    switch (name) {
      case 'trade':
        return 'Choisissez le métier concerné.';
      case 'city':
        return 'Indiquez votre ville.';
      case 'name':
        return 'Indiquez votre nom pour que l’on sache à qui répondre.';
      case 'reply':
        if (errors['required']) return this.channel() === 'email' ? 'Indiquez votre e-mail.' : 'Indiquez votre numéro.';
        return this.channel() === 'email'
          ? 'Cet e-mail n’est pas valide. Exemple : nom@exemple.ma'
          : 'Ce numéro n’est pas valide. Exemple : 06 12 34 56 78 ou +212 6 12 34 56 78';
      case 'message':
        if (errors['required']) return 'Écrivez votre message.';
        if (errors['maxlength']) return `Votre message dépasse ${MESSAGE_MAX} caractères.`;
        return 'Ajoutez quelques détails : 20 caractères minimum.';
    }
  }

  protected send(via: 'email' | 'whatsapp'): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      // Once the error states are rendered, move focus to the first field that needs fixing
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
      return;
    }

    const text = this.composeMessage();
    if (via === 'whatsapp') {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    } else {
      const subject = `[Hrayfi] ${this.c.subject.value}`;
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    }
    this.sentVia.set(via);
  }

  protected async copy(key: 'phone' | 'email', value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return; // Clipboard blocked (insecure context, permissions): the link itself still works
    }
    this.copied.set(key);
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(null), 2000);
  }

  protected reset(): void {
    this.form.reset();
    this.submitted.set(false);
    this.sentVia.set(null);
  }

  private composeMessage(): string {
    const v = this.form.getRawValue();
    const channel = this.channels.find((ch) => ch.value === v.channel)!.label;
    const lines = [
      `Demande : ${v.subject}`,
      `Profil : ${v.role === 'artisan' ? 'Artisan' : 'Particulier'}`,
    ];
    if (this.needsDetails()) {
      lines.push(`Métier : ${v.trade}`, `Ville : ${v.city}`);
      if (v.role === 'particulier') lines.push(`Délai : ${v.timing}`);
    }
    lines.push('', v.message.trim(), '', `${v.name.trim()}`, `Me répondre par ${channel.toLowerCase()} : ${v.reply.trim()}`);
    return lines.join('\n');
  }
}

/** Office hours in Casablanca: Monday to Saturday, 9 h to 19 h. */
function isOfficeOpen(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Casablanca',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  return weekday !== 'Sun' && hour >= 9 && hour < 19;
}
