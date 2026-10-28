import { Component } from '@angular/core';

/** Confirmation mark: a mint disc pops in, a tick draws itself, a few dots burst out. */
@Component({
  selector: 'app-success-pop',
  standalone: true,
  host: { class: 'success-pop inline-block', '[attr.aria-hidden]': 'true' },
  template: `
    <svg viewBox="-40 -40 80 80" class="w-full h-full overflow-visible">
      @for (d of dots; track $index) {
        <circle class="dot" r="3.5" [attr.fill]="d.fill" [style.--dx.px]="d.x" [style.--dy.px]="d.y" />
      }
      <circle class="disc" r="24" fill="#22b07d" stroke="#10302a" stroke-width="2.5" />
      <path class="tick" d="M-10 1 L-3 8 L11 -7" pathLength="1" fill="none" stroke="#10302a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
  styles: `
    .disc { transform-origin: center; animation: pop 0.45s var(--ease-back) both; }
    .tick { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 0.3s var(--ease-out) 0.3s forwards; }
    .dot { opacity: 0; animation: burst 0.6s var(--ease-out) 0.25s forwards; }
    @keyframes pop { from { transform: scale(0); } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes burst {
      0% { opacity: 1; transform: translate(0, 0) scale(0.6); }
      100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .tick { stroke-dashoffset: 0; }
    }
  `,
})
export class SuccessPopComponent {
  protected readonly dots = [0, 60, 120, 180, 240, 300].map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    return { x: Math.cos(rad) * 36, y: Math.sin(rad) * 36, fill: ['#ffe14d', '#f4b9a6', '#22b07d'][i % 3] };
  });
}
