import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { requireSession } from './require-session';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [requireSession] },
  { path: '**', redirectTo: '' },
];
