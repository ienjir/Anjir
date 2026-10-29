import { makeError, Result, FitError } from '@core/error';
import { environment } from '@environments/environment';
import { Decoder, Stream, FitMessages, RecordMesg, SessionMesg } from '@garmin/fitsdk';
import { HikeStats } from '@hike/models/hike.model';
import { TrackPoint } from '@hike/models/track.model';
import { NormalizedActivity } from '@import/models/gpx.model';
import { generate_geo_bounds, haversine_distance } from '@import/shared/geo';

/** Entry point: FIT file -> NormalizedActivity. */
export async function parse_fit(file: File): Promise<Result<NormalizedActivity>> {
  const decoded = await decode_fit(file);
  if (!decoded.success) return decoded;
  return fit_messages_to_normalized_activity(decoded.data);
}

export async function decode_fit(file: File): Promise<Result<FitMessages>> {
  const array_buffer = await file.arrayBuffer();

  const stream = Stream.fromByteArray(new Uint8Array(array_buffer));
  const decoder = new Decoder(stream);

  if (!decoder.isFIT() || !decoder.checkIntegrity()) {
    return { success: false, error: makeError(FitError.NOT_VLD) };
  }

  const { messages, errors } = decoder.read({
    convertDateTimesToDates: true,
    convertTypesToStrings: true,
    applyScaleAndOffset: true,
    expandSubFields: true,
    expandComponents: true,
  });

  if (errors.length > 0) {
    console.error(errors);
    return { success: false, error: makeError(FitError.READ) };
  }

  return { success: true, data: messages };
}

export function fit_messages_to_normalized_activity(fit_messages: FitMessages): Result<NormalizedActivity> {
  if (!fit_messages.recordMesgs || fit_messages.recordMesgs.length === 0) {
    return { success: false, error: makeError(FitError.NO_RECORD_MESG) };
  }

  const session = fit_messages.sessionMesgs?.[0];
  if (!session) {
    return { success: false, error: makeError(FitError.NO_SESSION_MESG) };
  }

  const track_points = record_mesgs_to_tracksegs(fit_messages.recordMesgs);

  const hike_stats_result = generate_fit_hike_stats(session, track_points);
  if (!hike_stats_result.success) return hike_stats_result;

  const bounds_result = generate_geo_bounds(track_points);
  if (!bounds_result.success) return bounds_result;

  return {
    success: true,
    data: {
      bounds: bounds_result.data,
      segments: track_points,
      suggestedName: session.sport?.toString(),
      hikeStats: hike_stats_result.data,
    },
  };
}

export function record_mesgs_to_tracksegs(records: RecordMesg[]): TrackPoint[][] {
  if (!records || records.length === 0) return [];

  const segments: TrackPoint[][] = [];
  let current_segment: TrackPoint[] = [];

  for (const record of records) {
    if (!record.timestamp || record.positionLat === undefined || record.positionLong === undefined) {
      continue;
    }

    const track_point: TrackPoint = {
      lat: fit_semicircles_to_degrees(record.positionLat),
      lon: fit_semicircles_to_degrees(record.positionLong),
      timestamp: new Date(record.timestamp),
      elevationMeters: record.altitude ?? record.enhancedAltitude,
      heartRate: record.heartRate,
      cadence: record.cadence ?? record.cadence256,
      temperature: record.temperature,
    };

    if (current_segment.length > 0) {
      const prev_point = current_segment[current_segment.length - 1];
      const time_gap_seconds = (track_point.timestamp.getTime() - prev_point.timestamp.getTime()) / 1000;

      if (time_gap_seconds > environment.gap_threshold_seconds) {
        segments.push(current_segment);
        current_segment = [];
      }
    }

    current_segment.push(track_point);
  }

  if (current_segment.length > 0) segments.push(current_segment);

  return segments;
}

function fit_semicircles_to_degrees(semicircles: number): number {
  return (semicircles * 180) / 2 ** 31;
}

export function generate_fit_hike_stats(session_mesg: SessionMesg, track_seg: TrackPoint[][]): Result<HikeStats> {
  const distance_meters = session_mesg.totalDistance ?? 0;

  if (distance_meters === 0) {
    return { success: false, error: makeError(FitError.NO_DISTANCE_DATA) };
  }

  const total_seconds = session_mesg.totalElapsedTime ?? 0;
  const moving_seconds = session_mesg.totalTimerTime ?? 0;
  const distance_km = distance_meters / 1000;

  let max_meters = -Infinity;
  let min_meters = Infinity;
  let min_pace_sec = Infinity;
  let max_pace_sec = -Infinity;

  for (const segment of track_seg) {
    for (let i = 0; i < segment.length; i++) {
      const curr = segment[i];

      if (curr.elevationMeters !== undefined) {
        max_meters = Math.max(max_meters, curr.elevationMeters);
        min_meters = Math.min(min_meters, curr.elevationMeters);
      }

      if (i === 0) continue;

      const prev = segment[i - 1];
      const interval_km = haversine_distance(curr, prev) / 1000;
      const interval_seconds = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;

      if (interval_km > 0 && interval_seconds > 0) {
        const pace = interval_seconds / interval_km;
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
      elevationGainMeters: session_mesg.totalAscent ?? 0,
      elevationLossMeters: session_mesg.totalDescent ?? 0,
      elevationMaxMeters: max_meters === -Infinity ? 0 : max_meters,
      elevationMinMeters: min_meters === Infinity ? 0 : min_meters,
      avgPaceSecondsPerKm: total_seconds / distance_km,
      avgPaceMovingSecondsPerKm: moving_seconds > 0 ? moving_seconds / distance_km : 0,
      minPaceSecondsPerKm: min_pace_sec,
      maxPaceSecondsPerKm: max_pace_sec,
      avgHeartRate: session_mesg.avgHeartRate ?? undefined,
      minHeartRate: undefined,
      maxHeartRate: session_mesg.maxHeartRate ?? undefined,
      avgCadence: session_mesg.avgCadence ?? undefined,
      minCadence: undefined,
      maxCadence: session_mesg.maxCadence ?? undefined,
      averageTemperatureCelsius: session_mesg.avgTemperature ?? undefined,
    },
  };
}
