import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { environment } from '@environments/environment';
import { Maintenance } from '@features/maintenance/maintenance';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Maintenance],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('anjir');
  protected readonly maintenance = signal(environment.maintenance);
}
