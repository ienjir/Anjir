import { Component, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { environment } from '@environments/environment';
import { Maintenance } from '@features/maintenance/maintenance';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Maintenance, TranslatePipe, TranslateDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('anjir');
  protected readonly maintenance = signal(environment.maintenance);
  private translate = inject(TranslateService);

  name = 'Andreas';

  switch_language() {
    this.translate.use('de');
  }
}
