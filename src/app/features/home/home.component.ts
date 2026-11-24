import { Component, DestroyRef, inject, signal } from '@angular/core';
import { loadCatalog, loadedCatalog, NavCatalog, portalEntry } from '../../layout/navbar/nav-catalog';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly catalog = signal<NavCatalog | null>(loadedCatalog() ?? null);

  constructor() {
    const request = new AbortController();
    inject(DestroyRef).onDestroy(() => request.abort());
    void loadCatalog(request.signal).then((value) => this.catalog.set(value));
  }

  get portalHome(): string {
    return portalEntry(this.catalog());
  }
}
