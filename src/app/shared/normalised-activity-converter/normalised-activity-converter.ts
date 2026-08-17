import { SyntaxValidator } from 'fast-xml-validator';
import { XMLParser } from 'fast-xml-parser';
import { RawGpxRoot, NormalizedActivity, RawGpx } from '@models/gpx.model';
import { HikeStats } from '@models/hike.model';
import { TrackPoint } from '@models/track.model';
import { environment } from '@environments/environment';
import { Decoder, Stream, FitMessages, SessionMesg } from '@garmin/fitsdk';
import { haversine_distance, raw_gpx_point_to_track_point, record_mesgs_to_tracksegs, smoothElevation } from '@shared/normalised-activity-converter/normalised-activity-converter-helper';

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
      error: makeError('GPX_NO_ROUTES')
    };
  }

  // If a track is existant check if tracksegments are there
  if (raw_gpx.trk[0].trkseg == undefined || raw_gpx.trk[0].trkseg?.length == 0) {
    return {
      success: false,
      error: makeError('GPX_NO_TRKSEG')
    };
  }

  if (raw_gpx.trk[0].trkseg[0].trkpt == undefined || raw_gpx.trk[0].trkseg[0].trkpt.length == 0) {
    return {
      success: false,
      error: makeError('GPX_NO_TRKPNT')
    };
  }

  if (raw_gpx.trk[0].trkseg.some((seg) => seg.trkpt == undefined || seg.trkpt.length === 0)) {
    return {
      success: false,
      error: makeError('GPX_EMPTY_SEG')
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

  const hike_stats_result = generate_gpx_hike_stats(points)

  if (!hike_stats_result.success) return hike_stats_result;

  return {
    success: true,
    data: {
      hikeStats: hike_stats_result.data,
      segments: points,
      suggestedName: raw_gpx.metadata?.name,
    },
  };
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
      error: makeError('GPX_NO_VLD_TRK_DTA')
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

export async function decode_fit(file: File): Promise<Result<FitMessages>> {
  const arrayBuffer = await file.arrayBuffer();

  const stream = Stream.fromByteArray(new Uint8Array(arrayBuffer));
  const decoder = new Decoder(stream);

  if (!decoder.isFIT()) {
    return {
      success: false,
      error: makeError('FIT_NOT_VLD'),
    }
  }

  if (!decoder.checkIntegrity()) {
    return {
      success: false,
      error: makeError('FIT_NOT_VLD'),
    }
  }

  const { messages, errors } = decoder.read({
    convertDateTimesToDates: true,
    convertTypesToStrings: true,
    applyScaleAndOffset: true,
    expandSubFields: true,
    expandComponents: true,
  });

  if (errors.length > 0) {
    console.error(errors)
    return {
      success: false,
      error: makeError('FIT_READ')
    }
  }

  return {
    success: true,
    data: messages,
  };
}


export function fit_messages_to_normalized_activity(fit_messges: FitMessages): Result<NormalizedActivity> {
  if (!fit_messges.recordMesgs || fit_messges.recordMesgs.length === 0) {
    return { success: false, error: makeError('FIT_NO_RECORD_MESG') };
  }

  const session = fit_messges.sessionMesgs?.[0];
  if (!session) {
    return { success: false, error: makeError('FIT_NO_SESSION_MESG') };
  }

  const track_points = record_mesgs_to_tracksegs(fit_messges.recordMesgs);
  const hike_stats_result = generate_fit_hike_stats(session, track_points);

  if (!hike_stats_result.success) return hike_stats_result;

  return {
    success: true,
    data: {
      segments: track_points,
      suggestedName: session.sport?.toString(),
      hikeStats: hike_stats_result.data,
    },
  };
}

export function generate_fit_hike_stats(session_mesg: SessionMesg, track_seg: TrackPoint[][]): Result<HikeStats> {
  const distance_meters = session_mesg.totalDistance ?? 0;

  if (distance_meters === 0) {
    return {
      success: false,
      error: makeError('FIT_NO_DISTANCE_DATA')
    };
  }

  let min_pace_sec = Infinity;
  let max_pace_sec = -Infinity;
  const total_seconds = session_mesg.totalElapsedTime ?? 0;
  const moving_seconds = session_mesg.totalTimerTime ?? 0;
  const gain_meters = session_mesg.totalAscent ?? 0;
  const loss_meters = session_mesg.totalDescent ?? 0;
  let max_meters = -Infinity;
  let min_meters = Infinity;

  for (const segment of track_seg) {
    for (const point of segment) {
      if (point.elevationMeters !== undefined) {
        max_meters = Math.max(max_meters, point.elevationMeters);
        min_meters = Math.min(min_meters, point.elevationMeters);
      }
    }
  }

  max_meters = max_meters === -Infinity ? 0 : max_meters;
  min_meters = min_meters === Infinity ? 0 : min_meters;

  const avg_hrt = session_mesg.avgHeartRate ?? undefined;
  const max_hrt = session_mesg.maxHeartRate ?? undefined;
  const avg_cadence = session_mesg.avgCadence ?? undefined;
  const max_cadence = session_mesg.maxCadence ?? undefined;
  const avg_temperature_celsius = session_mesg.avgTemperature ?? undefined;

  const distance_km = distance_meters / 1000;
  const avg_pace_sec = total_seconds / distance_km;
  const avg_pace_mov_sec = moving_seconds > 0 ? moving_seconds / distance_km : 0;

  for (const segment of track_seg) {
    for (let i = 1; i < segment.length; i++) {
      const prev = segment[i - 1];
      const curr = segment[i];
      const interval_distance = haversine_distance(curr, prev) / 1000;
      const interval_time = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;

      if (interval_distance > 0 && interval_time > 0) {
        const pace = interval_time / interval_distance;
        min_pace_sec = Math.min(min_pace_sec, pace);
        max_pace_sec = Math.max(max_pace_sec, pace);
      }
    }
  }

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
      minHeartRate: undefined,
      maxHeartRate: max_hrt,
      avgCadence: avg_cadence,
      minCadence: undefined,
      maxCadence: max_cadence,
      averageTemperatureCelsius: avg_temperature_celsius,
    }
  }
}
