import { SyntaxValidator } from 'fast-xml-validator';
import { XMLParser } from 'fast-xml-parser';
import { RawGpxRoot, NormalizedActivity, RawGpx, RawGpxPoint } from '../models/gpx.model';
import { HikeStats } from '../models/hike.model';
import { TrackPoint } from '../models/track.model';
import { environment } from '@environments/environment';
import { hrtime } from 'process';

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
        code: ErrorCode.GPX_NO_ROUTES,
        message: 'Gpx does not have a route or has more than 1',
        userMessage: 'err.gpx.gpx_none_or_too_many_tracks',
      },
    };
  }

  // If a track is existant check if tracksegments are there
  if (raw_gpx.trk[0].trkseg == undefined || raw_gpx.trk[0].trkseg?.length == 0) {
    return {
      success: false,
      error: {
        code: ErrorCode.GPX_NO_TRKSEG,
        message: 'Gpx file does not have any trackseg on the first track',
        userMessage: 'err.gpx.gpx_no_track_seg_on_track',
      },
    };
  }

  if (raw_gpx.trk[0].trkseg[0].trkpt == undefined || raw_gpx.trk[0].trkseg[0].trkpt.length == 0) {
    return {
      success: false,
      error: {
        code: ErrorCode.GPX_NO_TRKPNT,
        message: 'Gpx file does not have any track points on the track segment',
        userMessage: 'err.gpx.gpx_no_track_points_on_trackseg',
      },
    };
  }

  if (raw_gpx.trk[0].trkseg.some((seg) => seg.trkpt == undefined || seg.trkpt.length === 0)) {
    return {
      success: false,
      error: {
        code: ErrorCode.GPX_EMPTY_SEG,
        message: 'GPX file has a segment with no trackpoints',
        userMessage: 'err.gpx.gpx_empty_segment',
      },
    };
  }

  const points: TrackPoint[][] = [];

  for (const trkseg of raw_gpx.trk[0].trkseg) {
    const segmentPoints: TrackPoint[] = [];

    for (const trkpt of trkseg.trkpt ?? []) {
      const result = raw_gpx_point_to_track_point(trkpt);

      if (!result.success) {
        return result;
      }

      segmentPoints.push(result.data);
    }

    points.push(segmentPoints);
  }

  return {
    success: true,
    data: {
      segments: points,
      suggestedName: raw_gpx.metadata?.name,
    },
  };
}

export function raw_gpx_point_to_track_point(raw_gpx_point: RawGpxPoint): Result<TrackPoint> {
  if (raw_gpx_point === undefined) {
    return {
      success: false,
      error: {
        code: ErrorCode.GPX_UND_TRKPNT,
        message: 'Track point is undefined',
        userMessage: 'err.gpx.gpx_trackpoint_is_undefined'
      }
    }
  }

  if (raw_gpx_point.time === undefined) {
    return {
      success: false,
      error: {
        code: ErrorCode.GPX_NO_TMPSTMP,
        message: ('No timestamp on track point (Lat: ' + raw_gpx_point.lat + ', Lon: ' + raw_gpx_point.lon),
                  userMessage: 'err.gpx.gpx_no_timestamp'
      }
    }
  }

  return {
    success: true,
    data: {
      lat: raw_gpx_point.lat,
      lon: raw_gpx_point.lon,
      elevationMeters: raw_gpx_point.ele,
      timestamp: new Date(raw_gpx_point.time),
    }
  };
}

export function generate_hike_stats(track_seg: TrackPoint[][]): Result<HikeStats> {
  let moving_seconds = 0;
  let total_seconds = 0;
  let distance_meters = 0;
  let max_meters = -Infinity;
  let min_meters = Infinity;
  let gain_meters = 0;
  let loss_meters = 0;
  let min_pace_sec = Infinity;
  let max_pace_sec = -Infinity;
  let temp_sum = 0;
  let temp_count = 0;
  let hrt_sum = 0;
  let hrt_count = 0;
  let min_hrt = Infinity;
  let max_hrt = -Infinity;
  let cadence_sum = 0;
  let cadence_count = 0;
  let min_cadence = Infinity;
  let max_cadence = -Infinity;


  for (const segment of track_seg) {
    let prev_point: TrackPoint | null = null;
    let prev_elevation: number | null = null;

    let elevation = smoothElevation(segment);

    for (let i = 0; i < segment.length; i++) {
      const trk_pnt = segment[i];
      const current_elevation = elevation[i];

      max_meters = Math.max(max_meters, current_elevation);
      min_meters = Math.min(min_meters, current_elevation);

      if (prev_elevation !== null) {
        const elevation_delta = current_elevation - prev_elevation;
        if (elevation_delta > 0) {
          gain_meters += elevation_delta;
        } else {
          loss_meters += Math.abs(elevation_delta);
        }
      }

      if (prev_point !== null) {
        const pnt_distance = haversine_distance(trk_pnt, prev_point)

        if (pnt_distance > 0) {
          distance_meters += pnt_distance;

          const time_seconds = (trk_pnt.timestamp.getTime() - prev_point.timestamp.getTime()) / 1000;
          total_seconds += time_seconds;

          const speed_threshold = pnt_distance / time_seconds;

          if (speed_threshold > environment.speed_threshold) {
            moving_seconds += time_seconds;
          }

          max_pace_sec = Math.max(max_pace_sec, (time_seconds / (pnt_distance / 1000)))
          min_pace_sec = Math.min(min_pace_sec, (time_seconds / (pnt_distance / 1000)))
        }

        if (trk_pnt.temperature !== undefined) {
          temp_sum += trk_pnt.temperature;
          temp_count++;
        }

        if (trk_pnt.cadence !== undefined) {
          cadence_sum += trk_pnt.cadence;
          cadence_count++;
          min_cadence = Math.min(min_cadence, trk_pnt.cadence);
          max_cadence = Math.max(max_cadence, trk_pnt.cadence);
        }

        if (trk_pnt.heartRate !== undefined) {
          hrt_sum += trk_pnt.heartRate;
          hrt_count++;
          min_hrt = Math.min(min_hrt, trk_pnt.heartRate);
          max_hrt = Math.max(max_hrt, trk_pnt.heartRate);
        }

        prev_point = trk_pnt;
        prev_elevation = current_elevation;
      }

    }
  }

  if (distance_meters === 0) {
    return {
      success: false,
      error: {
        code: ErrorCode.GPX_NO_VLD_TRK_DTA,
        message: 'No valid track data to calculate stats',
        userMessage: 'err.gpx_no_valid_track_data',
      },
    };
  }

  const avg_pace_sec = total_seconds / (distance_meters / 1000);
  const avg_pace_mov_sec = moving_seconds / (distance_meters / 1000);
  const avg_temperature_celsius = temp_count > 0 ? temp_sum / temp_count : undefined;
  const avg_cadence = cadence_count > 0 ? cadence_sum / cadence_count : undefined;
  const min_cadence_result = cadence_count > 0 ? min_cadence : undefined;
  const max_cadence_result = cadence_count > 0 ? max_cadence : undefined;
  const avg_hrt = hrt_count > 0 ? hrt_sum / hrt_count : undefined;
  const min_hrt_result = hrt_count > 0 ? min_hrt : undefined;
  const max_hrt_result = hrt_count > 0 ? max_hrt : undefined;

  return {
    success: true,
    data: {
      distanceMeters: distance_meters,
      durationSeconds: total_seconds,
      durationMovingSeconds: moving_seconds,
      elevationGainMeters: gain_meters,
      elevationLossMeters: loss_meters,
      elevationMaxMeters: max_meters,
      elevationMinMeters: min_meters,
      avgPaceSecondsPerKm: avg_pace_sec,
      avgPaceMovingSecondsPerKm: avg_pace_mov_sec,
      minPaceSecondsPerKm: min_pace_sec,
      maxPaceSecondsPerKm: max_pace_sec,
      avgHeartRate: avg_hrt,
      minHeartRate: min_hrt_result,
      maxHeartRate: max_hrt_result,
      avgCadence: avg_cadence,
      minCadence: min_cadence_result,
      maxCadence: max_cadence_result,
      averageTemperatureCelsius: avg_temperature_celsius,
    },
  };
}

function smoothElevation(points: TrackPoint[]): number[] {
  const smoothed = points.map(p => p.elevationMeters ?? 0);
  for (let i = 1; i < smoothed.length - 1; i++) {
    const avg = (smoothed[i - 1] + smoothed[i] + smoothed[i + 1]) / 3;
    if (Math.abs(smoothed[i] - avg) < environment.elevation_smoothing_tolerance) {
      smoothed[i] = avg;
    }
  }
  return smoothed;
}

function haversine_distance(pointA: TrackPoint, pointB: TrackPoint): number {
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

function to_radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
