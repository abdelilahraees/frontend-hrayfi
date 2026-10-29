import { Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { mediaUrl } from '../../core/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { METIERS, VILLES } from '../../core/metiers';
import { Annonce, AnnonceImage } from '../../core/models';
import { AnnonceService } from '../../core/services/annonce.service';

const MAX_IMAGES = 8;
const MAX_SIZE = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type NewImage = { file: File; preview: string };

/** Création (/espace/artisan/annonces/nouvelle) et modification (/espace/artisan/annonces/:id/modifier). */
@Component({
  selector: 'app-annonce-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './annonce-form.page.html',
})
export class AnnonceFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(AnnonceService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  protected readonly isEdit = computed(() => !!this.id());

  protected readonly metiers = METIERS;
  protected readonly villes = VILLES;
  protected readonly maxImages = MAX_IMAGES;
  protected readonly mediaUrl = mediaUrl;

  protected readonly existing = signal<AnnonceImage[]>([]);
  protected readonly added = signal<NewImage[]>([]);
  protected readonly totalImages = computed(() => this.existing().length + this.added().length);
  protected readonly imageError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly loaded = signal(false);
  protected readonly dragging = signal(false);
  private readonly submitted = signal(false);

  protected readonly form = this.fb.group({
    titre: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(5000)]],
    metier: ['', Validators.required],
    ville: [''],
    prixMin: [null as number | null, Validators.min(0)],
    prixMax: [null as number | null, Validators.min(0)],
  });

  ngOnInit() {
    if (this.isEdit()) {
      this.api.get(Number(this.id())).subscribe({
        next: (a) => this.fill(a),
        error: () => this.router.navigateByUrl('/espace/artisan'),
      });
    } else {
      const u = this.auth.user();
      this.form.patchValue({ metier: u?.metier ?? '', ville: u?.ville ?? '' });
      // Le profil peut encore être en chargement au premier affichage
      if (!u) this.auth.loadMe().subscribe((me) => me && this.form.patchValue({ metier: me.metier ?? '', ville: me.ville ?? '' }));
      this.loaded.set(true);
    }
  }

  ngOnDestroy() {
    this.added().forEach((i) => URL.revokeObjectURL(i.preview));
  }

  private fill(a: Annonce) {
    if (a.artisanId !== this.auth.userId()) {
      this.router.navigateByUrl('/espace/artisan');
      return;
    }
    this.form.patchValue({
      titre: a.titre,
      description: a.description,
      metier: a.metier,
      ville: a.ville ?? '',
      prixMin: a.prixMin,
      prixMax: a.prixMax,
    });
    this.existing.set(a.images);
    this.loaded.set(true);
  }

  protected invalid(name: keyof typeof this.form.controls) {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected onFiles(list: FileList | null) {
    this.imageError.set(null);
    if (!list) return;
    const files = Array.from(list);
    const accepted: NewImage[] = [];
    for (const f of files) {
      if (!TYPES.includes(f.type)) {
        this.imageError.set(`« ${f.name} » n'est pas une image JPEG, PNG, WEBP ou GIF.`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        this.imageError.set(`« ${f.name} » dépasse 5 Mo.`);
        continue;
      }
      if (this.totalImages() + accepted.length >= MAX_IMAGES) {
        this.imageError.set(`${MAX_IMAGES} photos maximum par annonce.`);
        break;
      }
      accepted.push({ file: f, preview: URL.createObjectURL(f) });
    }
    this.added.update((l) => [...l, ...accepted]);
  }

  protected onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    this.onFiles(e.dataTransfer?.files ?? null);
  }

  protected removeAdded(i: NewImage) {
    URL.revokeObjectURL(i.preview);
    this.added.update((l) => l.filter((x) => x !== i));
  }

  protected removeExisting(img: AnnonceImage) {
    if (!confirm('Retirer cette photo de l\'annonce ?')) return;
    this.api.removeImage(Number(this.id()), img.id).subscribe({
      next: (a) => this.existing.set(a.images),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  protected submit() {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (v.prixMin != null && v.prixMax != null && v.prixMin > v.prixMax) {
      this.error.set('Le prix minimum doit être inférieur ou égal au prix maximum.');
      return;
    }

    const data = {
      titre: v.titre.trim(),
      description: v.description.trim(),
      metier: v.metier.trim(),
      ville: v.ville.trim(),
      prixMin: v.prixMin,
      prixMax: v.prixMax,
    };
    const files = this.added().map((i) => i.file);
    this.saving.set(true);

    const request$: Observable<Annonce> = this.isEdit()
      ? this.api
          .update(Number(this.id()), data)
          .pipe(switchMap((a) => (files.length ? this.api.addImages(a.id, files) : of(a))))
      : this.api.create(data, files);

    request$.subscribe({
      next: (a) => this.router.navigate(['/annonces', a.id]),
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
