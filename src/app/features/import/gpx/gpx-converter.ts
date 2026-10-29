import { SyntaxValidator } from 'fast-xml-validator';
import { XMLParser } from 'fast-xml-parser';
import { environment } from '@environments/environment';
import { HikeStats } from '@hike/models/hike.model';
import { TrackPoint } from '@hike/models/track.model';
import { NormalizedActivity, RawGpx, RawGpxPoint, RawGpxRoot } from '@import/models/gpx.model';
import { generate_geo_bounds, haversine_distance } from '@import/shared/geo';

/** Entry point: GPX text -> NormalizedActivity. RawGpx never leaves this file. */
export function parse_gpx(gpx_string: string): Result<NormalizedActivity> {
  const raw_gpx = gpx_string_to_raw_gpx(gpx_string);
  return raw_gpx_to_normalised_activity(raw_gpx.gpx);
}

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

  return result as RawGpx;
}

export function raw_gpx_to_normalised_activity(raw_gpx: RawGpxRoot): Result<NormalizedActivity> {
  if (raw_gpx.trk == undefined || raw_gpx.trk.length > 1) {
    return { success: false, error: makeError('GPX_NO_ROUTES') };
  }

  const trkseg = raw_gpx.trk[0].trkseg;
  if (trkseg == undefined || trkseg.length === 0) {
    return { success: false, error: makeError('GPX_NO_TRKSEG') };
  }

  if (trkseg[0].trkpt == undefined || trkseg[0].trkpt.length === 0) {
    return { success: false, error: makeError('GPX_NO_TRKPNT') };
  }

  if (trkseg.some((seg) => seg.trkpt == undefined || seg.trkpt.length === 0)) {
    return { success: false, error: makeError('GPX_EMPTY_SEG') };
  }

  const segments: TrackPoint[][] = [];

  for (const seg of trkseg) {
    const segment_points: TrackPoint[] = [];

    for (const trkpt of seg.trkpt ?? []) {
      const result = raw_gpx_point_to_track_point(trkpt);
      if (!result.success) return result;
      segment_points.push(result.data);
    }

    segments.push(segment_points);
  }

  const hike_stats_result = generate_gpx_hike_stats(segments);
  if (!hike_stats_result.success) return hike_stats_result;

  const bounds_result = generate_geo_bounds(segments);
  if (!bounds_result.success) return bounds_result;

  return {
    success: true,
    data: {
      bounds: bounds_result.data,
      hikeStats: hike_stats_result.data,
      segments,
      suggestedName: raw_gpx.metadata?.name,
    },
  };
}

export function raw_gpx_point_to_track_point(raw_gpx_point: RawGpxPoint): Result<TrackPoint> {
  if (raw_gpx_point === undefined) {
    return { success: false, error: makeError('GPX_UND_TRKPNT') };
  }

  if (raw_gpx_point.time === undefined) {
    return { success: false, error: makeError('GPX_NO_TMPSTMP') };
  }

  return {
    success: true,
    data: {
      lat: raw_gpx_point.lat,
      lon: raw_gpx_point.lon,
      elevationMeters: raw_gpx_point.ele,
      timestamp: new Date(raw_gpx_point.time),
    },
  };
}

export function smoothElevation(points: TrackPoint[]): number[] {
  const smoothed = points.map((p) => p.elevationMeters ?? 0);
  for (let i = 1; i < smoothed.length - 1; i++) {
    const avg = (smoothed[i - 1] + smoothed[i] + smoothed[i + 1]) / 3;
    if (Math.abs(smoothed[i] - avg) < environment.elevation_smoothing_tolerance) {
      smoothed[i] = avg;
    }
  }
  return smoothed;
}

export function generate_gpx_hike_stats(track_seg: TrackPoint[][]): Result<HikeStats> {
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

    const elevation = smoothElevation(segment);

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
        const pnt_distance = haversine_distance(trk_pnt, prev_point);

        if (pnt_distance > 0) {
          distance_meters += pnt_distance;

          const time_seconds = (trk_pnt.timestamp.getTime() - prev_point.timestamp.getTime()) / 1000;
          total_seconds += time_seconds;

          if (pnt_distance / time_seconds > environment.speed_threshold) {
            moving_seconds += time_seconds;
          }

          const pace = time_seconds / (pnt_distance / 1000);
          max_pace_sec = Math.max(max_pace_sec, pace);
          min_pace_sec = Math.min(min_pace_sec, pace);
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
      }

      prev_point = trk_pnt;
      prev_elevation = current_elevation;
    }
  }

  if (distance_meters === 0) {
    return { success: false, error: makeError('GPX_NO_VLD_TRK_DTA') };
  }

  const distance_km = distance_meters / 1000;

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
      avgPaceSecondsPerKm: total_seconds / distance_km,
      avgPaceMovingSecondsPerKm: moving_seconds / distance_km,
      minPaceSecondsPerKm: min_pace_sec,
      maxPaceSecondsPerKm: max_pace_sec,
      avgHeartRate: hrt_count > 0 ? hrt_sum / hrt_count : undefined,
      minHeartRate: hrt_count > 0 ? min_hrt : undefined,
      maxHeartRate: hrt_count > 0 ? max_hrt : undefined,
      avgCadence: cadence_count > 0 ? cadence_sum / cadence_count : undefined,
      minCadence: cadence_count > 0 ? min_cadence : undefined,
      maxCadence: cadence_count > 0 ? max_cadence : undefined,
      averageTemperatureCelsius: temp_count > 0 ? temp_sum / temp_count : undefined,
    },
  };
}
