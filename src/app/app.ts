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

  protected readonly gpx_file_string = `
  <gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="Wikipedia"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
    <!-- Comments look like this -->
  <metadata>
  <name>Data name</name>
  <desc>Valid GPX example without special characters</desc>
  <author>
  <name>Author name</name>
  </author>
  </metadata>
  <wpt lat="52.518611" lon="13.376111">
  <ele>35.0</ele>
  <time>2011-12-31T23:59:59Z</time>
  <name>Reichstag (Berlin)</name>
  <sym>City</sym>
  </wpt>
  <wpt lat="48.208031" lon="16.358128">
  <ele>179</ele>
  <time>2011-12-31T23:59:59Z</time>
  <name>Parlament (Wien)</name>
  <sym>City</sym>
  </wpt>
  <wpt lat="46.9466" lon="7.44412">
  <time>2011-12-31T23:59:59Z</time>
  <name>Bundeshaus (Bern)</name>
  <sym>City</sym>
  </wpt>
  </gpx>'
  `;
}
