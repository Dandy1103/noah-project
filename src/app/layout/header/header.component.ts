import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NoahHeaderAction, NoahHeaderComponent } from '@dandy1103/ui';
import { loadCatalog, loadedCatalog, NavCatalog, portalEntry } from '../navbar/nav-catalog';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NoahHeaderComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly catalog = signal<NavCatalog | null>(loadedCatalog() ?? null);
  readonly userName = signal('');

  constructor() {
    const request = new AbortController();
    inject(DestroyRef).onDestroy(() => request.abort());
    void loadCatalog(request.signal).then((value) => this.catalog.set(value));
    void loadDisplayName(request.signal).then((name) => this.userName.set(name));
  }

  get homeHref(): string {
    return portalEntry(this.catalog());
  }

  get actions(): NoahHeaderAction[] {
    const next = location.pathname + location.search;
    const query = new URLSearchParams({ next }).toString();
    return [
      { label: '個人資料', href: portalEntry(this.catalog(), 'profile') },
      { label: '我的權限', href: portalEntry(this.catalog(), 'permissions') },
      { label: '變更密碼', href: `/auth/change-password?${query}` },
      { label: '登出', href: `/auth/logout?${query}`, method: 'post' },
    ];
  }
}

async function loadDisplayName(signal: AbortSignal): Promise<string> {
  try {
    const response = await fetch('/api/me/employee', { signal, credentials: 'include' });
    if (!response.ok) return '';
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || !('displayName' in body)) return '';
    return typeof body.displayName === 'string' ? body.displayName : '';
  } catch {
    return '';
  }
}
