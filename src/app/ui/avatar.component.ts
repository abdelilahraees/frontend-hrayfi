import { Component, computed, input } from '@angular/core';

const COLORS = ['bg-menthe', 'bg-citron', 'bg-argile', 'bg-menthe-50'];

/** Pastille avec les initiales (pas de photo de profil côté API). */
@Component({
  selector: 'app-avatar',
  standalone: true,
  host: { class: 'inline-grid shrink-0' },
  template: `
    <span class="grid place-items-center rounded-full border-2 border-encre font-display font-bold leading-none pt-0.5"
          [class]="color()" [style.width.px]="size()" [style.height.px]="size()" [style.font-size.px]="size() * 0.4" aria-hidden="true">
      {{ initials() }}
    </span>
  `,
})
export class AvatarComponent {
  readonly name = input('');
  readonly size = input(48);

  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join(''),
  );
  protected readonly color = computed(() => {
    const sum = [...this.name()].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return COLORS[sum % COLORS.length];
  });
}
