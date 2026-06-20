import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { db } from '@core/db/db';
import { Hike, HikeSource, HikeStats } from './models/hike.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('anjir');

  hike_stats: HikeStats = {
    distanceMeters: 10000,
    durationSeconds: 1000,
    elevationGainMeters: 13,
    elevationLossMeters: 1000,
    elevationMaxMeters: 1031,
    elevationMinMeters: 10,
  }

  addToDb() {
    db.hikes.add({
      name: "Test",
      date: new Date(),
      source: HikeSource.gpx,
      stats: this.hike_stats,
      createdAt: new Date(),
    })
  }

  items = toSignal(
    from(liveQuery(() =>
                   db.hikes.toArray()
                  )),
                  { initialValue: [] as Hike[] }
  );
}
