import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { RealtimeService } from './core/realtime.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Instancié au démarrage : ouvre la connexion temps réel dès qu'une session existe
  private readonly realtime = inject(RealtimeService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map((e) => e.urlAfterRedirects)),
    { initialValue: this.router.url },
  );
  /** Espaces connectés (tableaux de bord, messagerie) : pied de page réduit au lieu du pied de page vitrine. */
  protected readonly appPage = computed(() => /^\/(espace|messages)(\/|\?|$)/.test(this.url()));
  protected readonly year = new Date().getFullYear();
}
