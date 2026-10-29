import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { API_URL } from '../api.config';
import { AuthResponse, Me, RegisterArtisan, RegisterClient, Role, UpdateProfile } from '../models';

interface Session {
  token: string;
  expiresAt: number;
  userId: number;
  email: string;
  role: Role;
}

const STORAGE_KEY = 'hrayfi.session';

/** Session JWT : stockée dans localStorage, le profil complet est chargé depuis /api/users/me. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(readSession());
  readonly user = signal<Me | null>(null);

  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly role = computed(() => this.session()?.role ?? null);
  readonly userId = computed(() => this.session()?.userId ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly displayName = computed(() => {
    const u = this.user();
    return u ? `${u.prenom} ${u.nom}` : (this.session()?.email ?? '');
  });

  constructor() {
    if (this.session()) this.loadMe().subscribe();
  }

  login(email: string, password: string): Observable<Me> {
    return this.http
      .post<AuthResponse>(`${API_URL}/api/auth/login`, { email, password })
      .pipe(switchMap((res) => this.start(res)));
  }

  registerClient(body: RegisterClient): Observable<Me> {
    return this.http
      .post<AuthResponse>(`${API_URL}/api/auth/register/client`, body)
      .pipe(switchMap((res) => this.start(res)));
  }

  registerArtisan(body: RegisterArtisan): Observable<Me> {
    return this.http
      .post<AuthResponse>(`${API_URL}/api/auth/register/artisan`, body)
      .pipe(switchMap((res) => this.start(res)));
  }

  updateProfile(body: UpdateProfile): Observable<Me> {
    return this.http.put<Me>(`${API_URL}/api/users/me`, body).pipe(tap((me) => this.user.set(me)));
  }

  loadMe(): Observable<Me | null> {
    return this.http.get<Me>(`${API_URL}/api/users/me`).pipe(
      tap((me) => this.user.set(me)),
      catchError(() => of(null)),
    );
  }

  logout(redirectTo: string | null = '/') {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
    this.user.set(null);
    if (redirectTo !== null) this.router.navigateByUrl(redirectTo);
  }

  /** Page d'accueil de l'espace connecté selon le rôle. */
  homeUrl(role: Role | null = this.role()): string {
    return role === 'ARTISAN' ? '/espace/artisan' : '/espace/client';
  }

  private start(res: AuthResponse): Observable<Me> {
    const session: Session = {
      token: res.accessToken,
      expiresAt: Date.now() + res.expiresInMs,
      userId: res.userId,
      email: res.email,
      role: res.role,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
    return this.http.get<Me>(`${API_URL}/api/users/me`).pipe(tap((me) => this.user.set(me)));
  }
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s.token || s.expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}
