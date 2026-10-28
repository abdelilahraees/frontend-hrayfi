import { Component, input } from '@angular/core';

export type StickerName =
  | 'wrench'
  | 'bolt'
  | 'saw'
  | 'roller'
  | 'bricks'
  | 'snow'
  | 'house'
  | 'star'
  | 'chat';

/** Hand-drawn tool stickers. Flat fills, ink outlines; the die-cut border comes from `.sticker`. */
@Component({
  selector: 'app-sticker',
  standalone: true,
  host: {
    class: 'sticker inline-block',
    '[style.--tilt]': 'tilt() + "deg"',
    '[attr.aria-hidden]': 'true',
  },
  template: `
    <svg viewBox="0 0 64 64" class="w-full h-full overflow-visible" fill="none" stroke="#10302a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      @switch (name()) {
        @case ('wrench') {
          <g transform="rotate(-40 32 32)">
            <rect x="27" y="26" width="10" height="34" rx="5" fill="#22b07d" />
            <path d="M20 12a12 12 0 0 0 24 0c0-3-1-6-3-8v10h-18V4c-2 2-3 5-3 8z" fill="#22b07d" />
            <path d="M23 14h18v6a9 9 0 0 1-18 0z" fill="#22b07d" />
            <circle cx="32" cy="52" r="2.5" fill="#fff" />
          </g>
        }
        @case ('bolt') {
          <path d="M36 4 14 36h14l-4 24 26-36H35z" fill="#ffe14d" />
          <path d="M33 12 24 30" stroke="#fff" stroke-width="3" />
        }
        @case ('saw') {
          <path d="M6 42 44 18l4 7-38 24z" fill="#e3ebe8" />
          <path d="M10 49l3-1-1 3 4-2-1 3 4-2-1 3 4-2-1 3 4-2-1 3 4-2-1 3 4-2" stroke-width="2" />
          <rect x="42" y="10" width="16" height="22" rx="7" transform="rotate(-32 50 21)" fill="#ffe14d" />
          <rect x="47" y="15" width="6" height="9" rx="3" transform="rotate(-32 50 21)" fill="#fff" />
        }
        @case ('roller') {
          <rect x="8" y="8" width="40" height="16" rx="8" fill="#f4b9a6" />
          <path d="M48 16h6v14H30v10" />
          <rect x="25" y="40" width="10" height="20" rx="5" fill="#22b07d" />
          <path d="M14 13h18" stroke="#fff" stroke-width="3" />
        }
        @case ('bricks') {
          <rect x="4" y="38" width="27" height="14" rx="3" fill="#f4b9a6" />
          <rect x="33" y="38" width="27" height="14" rx="3" fill="#f4b9a6" />
          <rect x="18" y="22" width="27" height="14" rx="3" fill="#f4b9a6" />
          <path d="M44 6l14 6-6 6-14-6z" fill="#e3ebe8" />
          <path d="M38 12l-8 8" stroke-width="3" />
        }
        @case ('snow') {
          <circle cx="32" cy="32" r="27" fill="#e9f8f1" />
          <path d="M32 12v40M14.7 22l34.6 20M14.7 42l34.6-20" stroke="#22b07d" stroke-width="3.5" />
          <path d="M27 15l5 5 5-5M27 49l5-5 5 5" stroke="#22b07d" stroke-width="3" />
        }
        @case ('house') {
          <path d="M8 30 32 8l24 22v26H8z" fill="#fff" />
          <path d="M8 30 32 8l24 22" fill="#22b07d" />
          <rect x="26" y="38" width="12" height="18" rx="2" fill="#ffe14d" />
        }
        @case ('star') {
          <path d="m32 5 8 17 18 2-13 12 4 18-17-9-17 9 4-18L6 24l18-2z" fill="#ffe14d" />
        }
        @case ('chat') {
          <path d="M8 14a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8H28l-12 12v-12a8 8 0 0 1-8-8z" fill="#22b07d" />
          <circle cx="22" cy="25" r="3" fill="#fff" stroke="none" />
          <circle cx="32" cy="25" r="3" fill="#fff" stroke="none" />
          <circle cx="42" cy="25" r="3" fill="#fff" stroke="none" />
        }
      }
    </svg>
  `,
})
export class StickerComponent {
  readonly name = input.required<StickerName>();
  readonly tilt = input(0);
}
