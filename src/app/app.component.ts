import { Component, signal } from '@angular/core';
import { NoahLoadingMaskComponent } from '@dandy1103/ui';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { SidenavComponent } from './layout/sidenav/sidenav.component';
import { loadCatalog } from './layout/navbar/nav-catalog';
import { signedIn } from './require-session';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavbarComponent, SidenavComponent, NoahLoadingMaskComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly shellReady = signal(false);

  constructor() {
    void this.open();
  }

  private async open(): Promise<void> {
    if (!await signedIn()) return;
    await loadCatalog().catch(() => null);
    this.shellReady.set(true);
  }
}
