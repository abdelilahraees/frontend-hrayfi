import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  Input,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements AfterViewInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  @Input() revealDelay = 0;
  @Input() revealThreshold = 0.15;
  @Input() revealOnce = true;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const node = this.el.nativeElement;

    if (this.revealDelay) {
      node.style.transitionDelay = `${this.revealDelay}ms`;
    }

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-revealed');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('is-revealed');
            if (this.revealOnce) observer.unobserve(node);
          } else if (!this.revealOnce) {
            node.classList.remove('is-revealed');
          }
        }
      },
      {
        threshold: this.revealThreshold,
        rootMargin: '0px 0px -60px 0px',
      },
    );

    observer.observe(node);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
