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
  <?xml version="1.0" encoding="UTF-8"?>
  <gpx version="1.1"
  creator="TestGenerator"
  xmlns="http://www.topografix.com/GPX/1/1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">

    <metadata>
  <name>Test Route</name>
  <desc>A small GPX file for parser testing</desc>
    <time>2024-06-01T08:00:00Z</time>
  </metadata>

  <!-- Waypoints -->
  <wpt lat="48.8584" lon="2.2945">
  <ele>35.0</ele>
  <time>2024-06-01T08:00:00Z</time>
  <name>Eiffel Tower</name>
  <desc>Starting waypoint</desc>
  </wpt>

  <wpt lat="48.8606" lon="2.3376">
  <ele>34.0</ele>
  <time>2024-06-01T09:00:00Z</time>
  <name>Louvre Museum</name>
  <desc>Second waypoint</desc>
  </wpt>

  <!-- Route -->
  <rte>
  <name>Paris Walking Route</name>
  <rtept lat="48.8584" lon="2.2945">
  <ele>35.0</ele>
  <name>Start</name>
  </rtept>
  <rtept lat="48.8592" lon="2.3050">
  <ele>33.5</ele>
  <name>Midpoint</name>
  </rtept>
  <rtept lat="48.8606" lon="2.3376">
  <ele>34.0</ele>
  <name>End</name>
  </rtept>
  </rte>

  <!-- Track -->
  <trk>
  <name>Test Track</name>
  <trkseg>
  <trkpt lat="48.8584" lon="2.2945">
  <ele>35.0</ele>
  <time>2024-06-01T08:00:00Z</time>
  </trkpt>
  <trkpt lat="48.8588" lon="2.3010">
  <ele>33.0</ele>
  <time>2024-06-01T08:15:00Z</time>
  </trkpt>
  <trkpt lat="48.8592" lon="2.3050">
  <ele>33.5</ele>
  <time>2024-06-01T08:30:00Z</time>
  </trkpt>
  <trkpt lat="48.8600" lon="2.3200">
  <ele>34.0</ele>
  <time>2024-06-01T08:45:00Z</time>
  </trkpt>
  <trkpt lat="48.8606" lon="2.3376">
  <ele>34.0</ele>
  <time>2024-06-01T09:00:00Z</time>
  </trkpt>
  </trkseg>
  </trk>

  </gpx>
  `;
}

