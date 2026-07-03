import { SyntaxValidator } from 'fast-xml-validator';
import { XMLParser } from 'fast-xml-parser';
import { RawGpxRoot, NormalizedActivity, RawGpx, RawGpxPoint } from '../models/gpx.model';
import { Hike, HikeSource, HikeStats } from '../models/hike.model';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { raw } from 'express';
import { Waypoint } from '../models/planned-hike.model';
import { TrackPoint } from '../models/track.model';

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

export function raw_gpx_to_normalised_activity(raw_gpx: RawGpxRoot): Result<NormalizedActivity> {
  // Return if track is more than 1
  if (raw_gpx.trk == undefined || raw_gpx.trk.length > 1) {
    return {
      success: false,
      error: {
        code: 'GPX_NONE_OR_TOO_MANY_TRACKS',
        message: 'Gpx does not have a route or has more than 1',
        userMessage: 'err.gpx_none_or_too_many_tracks',
      },
    };
  }

  // If a track is existant check if tracksegments are there
  if (raw_gpx.trk[0].trkseg == undefined || raw_gpx.trk[0].trkseg?.length == 0) {
    return {
      success: false,
      error: {
        code: 'GPX_NO_TRACKSEG_ON_TRACK',
        message: 'Gpx file does not have any trackseg on the first track',
        userMessage: 'err.gpx_no_track_seg_on_track',
      },
    };
  }

  if (raw_gpx.trk[0].trkseg[0].trkpt == undefined || raw_gpx.trk[0].trkseg[0].trkpt.length == 0) {
    return {
      success: false,
      error: {
        code: 'GPX_NO_TRACKPOINTS_ON_TRACKSEG',
        message: 'Gpx file does not have any track points on the track segements',
        userMessage: 'err.gpx_no_trackPoints_on_trackseg',
      },
    };
  }

  if (raw_gpx.trk[0].trkseg.some((seg) => seg.trkpt == undefined || seg.trkpt.length === 0)) {
    return {
      success: false,
      error: {
        code: 'GPX_EMPTY_SEGMENT',
        message: 'GPX file has a segment with no trackpoints',
        userMessage: 'err.gpx_empty_segment',
      },
    };
  }

  const points = raw_gpx.trk[0].trkseg.map((trkseg) =>
    trkseg.trkpt!.map((trkpt) => raw_gpx_point_to_track_point(trkpt)),
  );

  return {
    success: true,
    data: {
      segements: points,
      suggestedName: raw_gpx.metadata?.name,
    },
  };
}

export function raw_gpx_point_to_track_point(raw_gpx_point: RawGpxPoint): TrackPoint {
  return {
    lat: raw_gpx_point.lat,
    lon: raw_gpx_point.lon,
    elevationMeters: raw_gpx_point.ele,
    timestamp: raw_gpx_point.time ? new Date(raw_gpx_point.time) : undefined,
  };
}

// export function generate_hike_stats(track_points: TrackPoint[]): Result<HikeStats> {
//   let moving_seconds = 0;
//   let paused_seconds = 0;
//   let distance = 0;
//
//   if track_points
// }
//
// function to_radians(degrees: number): number {
//   return (degrees * Math.PI) / 180;
// }
//
// function haversine_distance(pointA: Waypoint, pointB: Waypoint): number {
//   const radius = 6371;
//
//   const deltaLatitude = to_radians(pointB.lat - pointA.lat);
//   const deltaLongitude = to_radians(pointB.lon - pointA.lon);
//
//   const halfChordLength =
//     Math.cos(to_radians(pointA.lat)) *
//       Math.cos(to_radians(pointB.lat)) *
//       Math.sin(deltaLongitude / 2) *
//       Math.sin(deltaLongitude / 2) +
//     Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2);
//
//   const angularDistance =
//     2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));
//
//   return radius * angularDistance;
// }
