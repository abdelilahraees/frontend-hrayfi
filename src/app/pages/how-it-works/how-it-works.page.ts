import { Component } from '@angular/core';
import { HowItWorksComponent } from '../../components/how-it-works/how-it-works.component';
import { FaqComponent } from '../../components/faq/faq.component';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [HowItWorksComponent, FaqComponent],
  template: `
    <app-how-it-works />
    <app-faq />
  `,
})
export class HowItWorksPage {}
