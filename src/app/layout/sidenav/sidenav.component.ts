import { Component, DestroyRef, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { fallbackSide, loadCatalog, sideSections, SideSection } from '../navbar/nav-catalog';

const SELF_REPO = 'noah-project';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  sections: SideSection[] = [];

  constructor() {
    const controller = new AbortController();
    inject(DestroyRef).onDestroy(() => controller.abort());
    void loadCatalog(controller.signal).then((catalog) => {
      const next = catalog ? sideSections(catalog, SELF_REPO) : [];
      this.sections = next.length ? next : fallbackSide(SELF_REPO);
    });
  }
}
