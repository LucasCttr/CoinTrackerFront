import { Component } from '@angular/core';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { GlobalHeaderComponent } from './layout/header/global-header/global-header.component';

@Component({
  selector: 'app-root',
  imports: [ DashboardComponent, GlobalHeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'coinTracker';
}
