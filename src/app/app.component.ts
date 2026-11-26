import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { signedIn } from './require-session';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly shellReady = signal(false);

  constructor() {
    void this.open();
  }

  private async open(): Promise<void> {
    if (!await signedIn()) return;
    this.shellReady.set(true);
  }
}
