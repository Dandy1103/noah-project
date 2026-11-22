import { Component } from '@angular/core';

@Component({
  selector: 'app-table',
  standalone: true,
  template: '<div class="data-table"><ng-content /></div>',
  styleUrl: './table.component.scss',
})
export class TableComponent {}
