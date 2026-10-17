import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, afterNextRender } from '@angular/core';
import { environment } from '@environments/environment';
import { Map } from 'maplibre-gl';

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


 constructor() {
    afterNextRender(async () => {
      const { Map } = await import('maplibre-gl');

      this.map = new Map({
        container: this.mapContainer.nativeElement,
        style: `https://api.maptiler.com/maps/streets-v4/style.json?key=${environment.map_tiler_api_key}`,
        center: [139.753, 35.6844],
        zoom: 14,
      });

      this.map.on('error', (e) => console.error('Map error:', e));
    });
  }

  // calculateZoom(): number {
  //   const mapdisplay = 322; //min of height and width of element which contains the map
  //   let dist = (6371 * Math.acos(Math.sin(min_lat / 57.2958) * Math.sin(max_lat / 57.2958) + (Math.cos(min_lat / 57.2958) * Math.cos(max_lat / 57.2958) * Math.cos((max_lon / 57.2958) - (min_lon / 57.2958)))));

  //   let zoom = Math.floor(8 - Math.log(1.6446 * dist / Math.sqrt(2 * (mapdisplay * mapdisplay))) / Math.log(2));

  //   if (numPoints == 1 || ((min_lat == max_lat) && (min_lon == max_lon))) {
  //     zoom = 11;
  //   }

  //   return zoom
  // }

  ngOnDestroy() {
    this.map?.remove();
  }
}
