import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { ServicesComponent } from '../../components/services/services.component';
import { HowItWorksComponent } from '../../components/how-it-works/how-it-works.component';
import { TestimonialsComponent } from '../../components/testimonials/testimonials.component';
import { FaqComponent } from '../../components/faq/faq.component';
import { SectionSkeletonComponent } from '../../ui/section-skeleton.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    HeroComponent,
    ServicesComponent,
    HowItWorksComponent,
    TestimonialsComponent,
    FaqComponent,
    SectionSkeletonComponent,
  ],
  template: `
    <app-hero />
    <app-services />
    <app-how-it-works />

    <!-- Below the fold: loaded in their own chunks as they approach the viewport -->
    @defer (on viewport; prefetch on idle) {
      <app-testimonials />
    } @placeholder {
      <app-section-skeleton variant="quotes" />
    }

    @defer (on viewport; prefetch on idle) {
      <app-faq />
    } @placeholder {
      <app-section-skeleton variant="list" tone="white" />
    }
  `,
})
export class HomePage {}
