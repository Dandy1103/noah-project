import { Component } from '@angular/core';
import { NoahNavbarComponent } from '@dandy1103/ui';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NoahNavbarComponent],
  template: `<noah-navbar repo="noah-project" fallbackLabel="專案管理" />`,
})
export class NavbarComponent {}
