import { max } from 'rxjs';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, afterNextRender, Input, input } from '@angular/core';
import { environment } from '@environments/environment';
import { Map } from 'maplibre-gl';
import { TrackData } from '@hike/models/track.model';

@Component({
  selector: 'app-hike-map',
  imports: [],
  templateUrl: './hike-map.html',
  styleUrl: './hike-map.scss',
})
export default class HikeMap implements OnDestroy {
  map: Map | undefined;

  @ViewChild('mapDiv')
  private mapContainer!: ElementRef<HTMLElement>;

  track_data = input.required<TrackData>();

 constructor() {
    afterNextRender(async () => {
      const { Map } = await import('maplibre-gl');

      this.map = new Map({
        container: this.mapContainer.nativeElement,
        style: `https://api.maptiler.com/maps/streets-v4/style.json?key=${environment.map_tiler_api_key}`,
        center: [((this.track_data().bounds.maxLat - this.track_data().bounds.minLat) / 2), ((this.track_data().bounds.maxLat - this.track_data().bounds.minLat) / 2)],
        zoom: this.calculateZoom(),
      });

      this.map.on('error', (e) => console.error('Map error:', e));
    });
  }

  calculateZoom(): number {
    const mapdisplay = 322; //min of height and width of element which contains the map
    let dist = (6371 * Math.acos(Math.sin(this.track_data().bounds.minLat / 57.2958) * Math.sin(this.track_data().bounds.maxLat / 57.2958) + (Math.cos(this.track_data().bounds.minLat / 57.2958) * Math.cos(this.track_data().bounds.maxLat / 57.2958) * Math.cos((this.track_data().bounds.maxLon / 57.2958) - (this.track_data().bounds.minLon / 57.2958)))));

    let zoom = Math.floor(8 - Math.log(1.6446 * dist / Math.sqrt(2 * (mapdisplay * mapdisplay))) / Math.log(2));

    if (((this.track_data().bounds.minLat == this.track_data().bounds.maxLat) && (this.track_data().bounds.minLon == this.track_data().bounds.minLon))) {
      zoom = 11;
    }

    return zoom
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
