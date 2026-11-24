import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NoahNavbarComponent } from '@dandy1103/ui';
import { applyNav, loadCatalog, NavCatalog } from './nav-catalog';

const repo = 'noah-project';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NoahNavbarComponent],
  template: `@if (groups(); as groups) { <noah-navbar [groups]="groups" [currentLabel]="currentLabel()" /> }`,
})
export class NavbarComponent {
  private readonly catalog = signal<NavCatalog | null>(null);

  constructor() {
    const request = new AbortController();
    inject(DestroyRef).onDestroy(() => request.abort());
    void loadCatalog(request.signal).then((value) => this.catalog.set(value));
  }

  readonly groups = computed(() => {
    const catalog = this.catalog();
    return catalog ? applyNav(catalog, repo) : null;
  });

  readonly currentLabel = computed(() => {
    const catalog = this.catalog();
    const group = catalog?.groups.find((value) => value.app === repo);
    return catalog?.systems.find((value) => value.repo === repo)?.name?.trim() || group?.label || '專案管理';
  });
}
