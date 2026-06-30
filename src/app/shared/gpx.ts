import { SyntaxValidator } from 'fast-xml-validator';
import { XMLParser } from 'fast-xml-parser';
import { RawGpx } from '../models/gpx.model';
import { Hike, HikeSource, HikeStats } from '../models/hike.model';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { raw } from 'express';
import { Waypoint } from '../models/planned-hike.model';

const translate = inject(TranslateService);

export function gpx_string_to_raw_gpx(gpx_string: string): RawGpx {
  const validation = SyntaxValidator.validate(gpx_string);
  if (validation !== true) throw new Error(`Invalid XML: ${validation.err.msg}`);

  const xml_parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseAttributeValue: true,
    parseTagValue: true,
    isArray: (tag) => ['wpt', 'rte', 'trk', 'trkseg', 'trkpt', 'rtept', 'link'].includes(tag),
  });

  const result = xml_parser.parse(gpx_string);
  if (!result?.gpx) throw new Error('Invalid GPX: missing root <gpx> element');

  const raw_gpx: RawGpx = result;

  return raw_gpx;
}

export function raw_gpx_to_hike(raw_gpx: RawGpx): Omit<Hike, 'id'> {
  return {
    name: raw_gpx.gpx.metadata?.name || translate.translate('gpx.unnamed_hike')(),
    date: new Date(raw_gpx.gpx.metadata?.time || Date.now()),
    source: HikeSource.gpx,
    stats: generate_hike_stats(raw_gpx),
    createdAt: new Date(),
  };
}

export function generate_hike_stats(raw_gpx: RawGpx): HikeStats {}

function to_radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversine_distance(pointA: Waypoint, pointB: Waypoint): number {
  const radius = 6371;

  const deltaLatitude = to_radians(pointB.lat - pointA.lat);
  const deltaLongitude = to_radians(pointB.lon - pointA.lon);

  const halfChordLength =
    Math.cos(to_radians(pointA.lat)) *
      Math.cos(to_radians(pointB.lat)) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2) +
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));

  return radius * angularDistance;
}
