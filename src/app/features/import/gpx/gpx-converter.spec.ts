import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GpxError } from '@core/error';
import { TrackPoint } from '@hike/models/track.model';
import { NormalizedActivity } from '@import/models/gpx.model';
import {
  generate_gpx_hike_stats,
  gpx_string_to_raw_gpx,
  parse_gpx,
  raw_gpx_to_normalised_activity,
} from './gpx-converter';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface Pt {
  lat?: number | string;
  lon?: number | string;
  ele?: number;
  /** Seconds after BASE_TIME. Omit to produce a point without <time>. */
  t?: number;
  /** Raw <time> content, overrides `t`. */
  time?: string;
}

const BASE_TIME = Date.parse('2026-06-01T08:00:00Z');
const EARTH_RADIUS_METERS = 6_371_000;

/** Exact length of a step of `dLat` degrees along a meridian (independent of the haversine implementation). */
const meridianMeters = (dLat: number) => EARTH_RADIUS_METERS * (Math.PI / 180) * dLat;

/** One step of 0.001° latitude ≈ 111.195 m */
const STEP = 0.001;
const STEP_M = meridianMeters(STEP);

const iso = (seconds: number) => new Date(BASE_TIME + seconds * 1000).toISOString();

function trkpt(p: Pt): string {
  const attrs = [
    p.lat !== undefined ? `lat="${p.lat}"` : '',
    p.lon !== undefined ? `lon="${p.lon}"` : '',
  ].join(' ');
  const ele = p.ele !== undefined ? `<ele>${p.ele}</ele>` : '';
  const time = p.time !== undefined ? `<time>${p.time}</time>` : p.t !== undefined ? `<time>${iso(p.t)}</time>` : '';
  return `<trkpt ${attrs}>${ele}${time}</trkpt>`;
}

const trkseg = (pts: Pt[]) => `<trkseg>${pts.map(trkpt).join('')}</trkseg>`;
const trk = (segs: Pt[][]) => `<trk><name>Track</name>${segs.map(trkseg).join('')}</trk>`;

function gpxDoc(body: string, metadata = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
${metadata}${body}
</gpx>`;
}

/** Points walking north along lon 0, one STEP per `dt` seconds. */
function walk(n: number, opts: { startLat?: number; startT?: number; dt?: number; ele?: (i: number) => number | undefined } = {}): Pt[] {
  const { startLat = 46, startT = 0, dt = 60, ele = () => 1000 } = opts;
  return Array.from({ length: n }, (_, i) => ({ lat: startLat + i * STEP, lon: 0, ele: ele(i), t: startT + i * dt }));
}

/** Full pipeline from string, mirrors parse_gpx without the File wrapper. */
function convert(xml: string) {
  const raw = gpx_string_to_raw_gpx(xml);
  if (!raw.success) return raw;
  return raw_gpx_to_normalised_activity(raw.data.gpx);
}

function expectOk(result: ReturnType<typeof convert>): NormalizedActivity {
  if (!result.success) {
    throw new Error(`Expected success, got ${result.error.code}: ${result.error.message}`);
  }
  return result.data;
}

function expectErr(result: ReturnType<typeof convert>, code: string) {
  expect(result.success).toBe(false);
  if (result.success) return undefined as never;
  expect(result.error.code as string).toBe(code);
  return result.error;
}

function tp(lat: number, t: number, extra: Partial<TrackPoint> = {}): TrackPoint {
  return { lat, lon: 0, elevationMeters: 1000, timestamp: new Date(BASE_TIME + t * 1000), ...extra };
}

// ---------------------------------------------------------------------------
// XML parsing
// ---------------------------------------------------------------------------

describe('gpx_string_to_raw_gpx', () => {
  it('parses a valid GPX document', () => {
    const result = gpx_string_to_raw_gpx(gpxDoc(trk([walk(2)])));
    expect(result.success).toBe(true);
  });

  it('parses lat/lon/ele as numbers and keeps <time> as a string', () => {
    const result = gpx_string_to_raw_gpx(gpxDoc(trk([[{ lat: 46.5, lon: 7.25, ele: 1234.5, t: 0 }]])));
    if (!result.success) throw new Error(result.error.message);

    const pt = result.data.gpx.trk![0].trkseg![0].trkpt![0];
    expect(pt.lat).toBe(46.5);
    expect(pt.lon).toBe(7.25);
    expect(pt.ele).toBe(1234.5);
    expect(pt.time).toBe(iso(0));
  });

  it('always returns trk / trkseg / trkpt as arrays, even with a single element', () => {
    const result = gpx_string_to_raw_gpx(gpxDoc(trk([[{ lat: 46, lon: 7, t: 0 }]])));
    if (!result.success) throw new Error(result.error.message);

    expect(Array.isArray(result.data.gpx.trk)).toBe(true);
    expect(Array.isArray(result.data.gpx.trk![0].trkseg)).toBe(true);
    expect(Array.isArray(result.data.gpx.trk![0].trkseg![0].trkpt)).toBe(true);
  });

  it('keeps numeric-looking text in non-numeric tags as strings', () => {
    const result = gpx_string_to_raw_gpx(gpxDoc(trk([walk(2)]), '<metadata><name>2026</name></metadata>'));
    if (!result.success) throw new Error(result.error.message);
    expect(result.data.gpx.metadata?.name).toBe('2026');
  });

  it('handles namespaced extensions (e.g. Garmin TrackPointExtension) without failing', () => {
    const xml = `<?xml version="1.0"?>
<gpx version="1.1" creator="Garmin" xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <trk><trkseg>
    <trkpt lat="46" lon="0"><ele>1000</ele><time>${iso(0)}</time>
      <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>120</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>
    </trkpt>
    <trkpt lat="46.001" lon="0"><ele>1000</ele><time>${iso(60)}</time></trkpt>
  </trkseg></trk>
</gpx>`;
    expectOk(convert(xml));
  });

  it('returns MALFORMED_XML with line/col for broken XML', () => {
    const err = expectErr(convert('<gpx>\n<trk>\n</gpx>'), GpxError.MALFORMED_XML.code);
    expect(err.params?.['line']).toEqual(expect.any(Number));
    expect(err.params?.['col']).toEqual(expect.any(Number));
  });

  it('returns MALFORMED_XML for a non-XML string', () => {
    expectErr(convert('this is not xml at all <<<'), GpxError.MALFORMED_XML.code);
  });

  it('returns an error (not a crash) for an empty string', () => {
    const result = convert('');
    expect(result.success).toBe(false);
  });

  it('returns NO_GPX_ROOT for valid XML with another root element', () => {
    expectErr(convert('<?xml version="1.0"?><kml><Document/></kml>'), GpxError.NO_GPX_ROOT.code);
  });
});

// ---------------------------------------------------------------------------
// Structure validation
// ---------------------------------------------------------------------------

describe('raw_gpx_to_normalised_activity — structure errors', () => {
  it('returns NO_TRACKS when the file has no <trk>', () => {
    expectErr(convert(gpxDoc('<wpt lat="46" lon="7"/>')), GpxError.NO_TRACKS.code);
  });

  it('returns MULTIPLE_TRACKS with the count when the file has more than one <trk>', () => {
    const err = expectErr(convert(gpxDoc(trk([walk(2)]) + trk([walk(2)]) + trk([walk(2)]))), GpxError.MULTIPLE_TRACKS.code);
    expect(err.params?.['count']).toBe(3);
  });

  it('returns NO_TRKSEG when the track has no <trkseg>', () => {
    expectErr(convert(gpxDoc('<trk><name>x</name></trk>')), GpxError.NO_TRKSEG.code);
  });

  it('returns NO_TRKPNT when the (first) segment has no points', () => {
    expectErr(convert(gpxDoc('<trk><trkseg></trkseg></trk>')), GpxError.NO_TRKPNT.code);
  });

  it('returns EMPTY_SEG when a later segment is empty', () => {
    expectErr(convert(gpxDoc(`<trk>${trkseg(walk(2))}<trkseg></trkseg></trk>`)), GpxError.EMPTY_SEG.code);
  });

  it('returns NO_TMPSTMP when a point has no <time>', () => {
    expectErr(convert(gpxDoc(trk([[{ lat: 46, lon: 0, t: 0 }, { lat: 46.001, lon: 0 }]]))), GpxError.NO_TMPSTMP.code);
  });

  it('returns NO_VLD_TRK_DTA for a single-point track', () => {
    expectErr(convert(gpxDoc(trk([walk(1)]))), GpxError.NO_VLD_TRK_DTA.code);
  });

  it('returns NO_VLD_TRK_DTA when all points are at the same location', () => {
    const pts: Pt[] = [0, 60, 120].map((t) => ({ lat: 46, lon: 0, ele: 1000, t }));
    expectErr(convert(gpxDoc(trk([pts]))), GpxError.NO_VLD_TRK_DTA.code);
  });
});

// ---------------------------------------------------------------------------
// Invalid point data — these error codes do not exist yet (agreed spec)
// ---------------------------------------------------------------------------

describe('raw_gpx_to_normalised_activity — invalid point data', () => {
  const INVALID_COORDS = 'GPX_INVALID_COORDS';
  const INVALID_TIME = 'GPX_INVALID_TIME';
  const TIME_NOT_INCREASING = 'GPX_TIME_NOT_INCREASING';

  it.each<[string, Pt]>([
    ['missing lat', { lon: 0, t: 60 }],
    ['missing lon', { lat: 46.001, t: 60 }],
    ['non-numeric lat', { lat: 'abc', lon: 0, t: 60 }],
    ['non-numeric lon', { lat: 46.001, lon: 'east', t: 60 }],
    ['lat > 90', { lat: 91, lon: 0, t: 60 }],
    ['lat < -90', { lat: -91, lon: 0, t: 60 }],
    ['lon > 180', { lat: 46.001, lon: 181, t: 60 }],
    ['lon < -180', { lat: 46.001, lon: -181, t: 60 }],
  ])('returns %s as INVALID_COORDS', (_label, bad) => {
    expectErr(convert(gpxDoc(trk([[{ lat: 46, lon: 0, t: 0 }, bad, { lat: 46.002, lon: 0, t: 120 }]]))), INVALID_COORDS);
  });

  it.each(['not a date', '', '2026-13-45T99:99:99Z'])('returns INVALID_TIME for <time>%s</time>', (time) => {
    expectErr(convert(gpxDoc(trk([[{ lat: 46, lon: 0, t: 0 }, { lat: 46.001, lon: 0, time }]]))), INVALID_TIME);
  });

  it('returns TIME_NOT_INCREASING when timestamps go backwards', () => {
    expectErr(convert(gpxDoc(trk([[{ lat: 46, lon: 0, t: 60 }, { lat: 46.001, lon: 0, t: 0 }]]))), TIME_NOT_INCREASING);
  });

  it('returns TIME_NOT_INCREASING when two consecutive points share a timestamp', () => {
    expectErr(convert(gpxDoc(trk([[{ lat: 46, lon: 0, t: 0 }, { lat: 46.001, lon: 0, t: 0 }]]))), TIME_NOT_INCREASING);
  });

  it('never produces NaN or Infinity in the stats of a successful result', () => {
    const data = expectOk(convert(gpxDoc(trk([walk(5)]))));
    for (const [key, value] of Object.entries(data.hikeStats)) {
      if (value === undefined) continue;
      expect(Number.isFinite(value), `${key} = ${value}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Output shape
// ---------------------------------------------------------------------------

describe('raw_gpx_to_normalised_activity — output', () => {
  it('converts points to TrackPoints with Date timestamps and elevation', () => {
    const data = expectOk(convert(gpxDoc(trk([[{ lat: 46, lon: 7, ele: 1500, t: 0 }, { lat: 46.001, lon: 7, ele: 1510, t: 60 }]]))));

    expect(data.segments).toHaveLength(1);
    expect(data.segments[0]).toHaveLength(2);
    expect(data.segments[0][0]).toMatchObject({ lat: 46, lon: 7, elevationMeters: 1500 });
    expect(data.segments[0][0].timestamp).toBeInstanceOf(Date);
    expect(data.segments[0][0].timestamp.getTime()).toBe(BASE_TIME);
    expect(data.segments[0][1].timestamp.getTime()).toBe(BASE_TIME + 60_000);
  });

  it('keeps segments separate and in order', () => {
    const data = expectOk(convert(gpxDoc(trk([walk(3), walk(2, { startLat: 47, startT: 3600 })]))));
    expect(data.segments.map((s) => s.length)).toEqual([3, 2]);
    expect(data.segments[1][0].lat).toBe(47);
  });

  it('computes bounds over all segments', () => {
    const seg1: Pt[] = [{ lat: 46, lon: 7, t: 0 }, { lat: 46.01, lon: 7.02, t: 60 }];
    const seg2: Pt[] = [{ lat: 45.99, lon: 6.98, t: 120 }, { lat: 46.005, lon: 7.03, t: 180 }];
    const data = expectOk(convert(gpxDoc(trk([seg1, seg2]))));

    expect(data.bounds).toEqual({ minLat: 45.99, maxLat: 46.01, minLon: 6.98, maxLon: 7.03 });
  });

  it('uses <metadata><name> as suggestedName', () => {
    const data = expectOk(convert(gpxDoc(trk([walk(2)]), '<metadata><name>Pilatus Loop</name></metadata>')));
    expect(data.suggestedName).toBe('Pilatus Loop');
  });

  it('leaves suggestedName undefined when there is no metadata name', () => {
    const data = expectOk(convert(gpxDoc(trk([walk(2)]))));
    expect(data.suggestedName).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Distance, duration, pace
// ---------------------------------------------------------------------------

describe('hike stats — distance / duration / pace', () => {
  it('sums the distance between consecutive points', () => {
    const data = expectOk(convert(gpxDoc(trk([walk(4)]))));
    expect(data.hikeStats.distanceMeters).toBeCloseTo(3 * STEP_M, 3);
  });

  it('does not count the gap between two segments as distance', () => {
    // Segment 2 starts ~11 km away from where segment 1 ended
    const data = expectOk(convert(gpxDoc(trk([walk(3), walk(3, { startLat: 46.1, startT: 3600 })]))));
    expect(data.hikeStats.distanceMeters).toBeCloseTo(4 * STEP_M, 3);
  });

  it('durationSeconds is elapsed time and includes standing still', () => {
    const pts: Pt[] = [
      { lat: 46.0, lon: 0, t: 0 },
      { lat: 46.001, lon: 0, t: 60 },
      { lat: 46.001, lon: 0, t: 660 }, // 10 min break at the same spot
      { lat: 46.002, lon: 0, t: 720 },
    ];
    const data = expectOk(convert(gpxDoc(trk([pts]))));
    expect(data.hikeStats.durationSeconds).toBe(720);
  });

  it('durationSeconds sums each segment but excludes the pause between segments', () => {
    const seg1 = walk(3, { startT: 0, dt: 60 }); //            0 → 120  = 120 s
    const seg2 = walk(3, { startLat: 46.01, startT: 3600, dt: 60 }); // 3600 → 3720 = 120 s
    const data = expectOk(convert(gpxDoc(trk([seg1, seg2]))));
    expect(data.hikeStats.durationSeconds).toBe(240);
  });

  it('durationMovingSeconds only counts intervals faster than the speed threshold (0.5 m/s)', () => {
    const pts: Pt[] = [
      { lat: 46.0, lon: 0, t: 0 },
      { lat: 46.001, lon: 0, t: 60 }, //   ~1.85 m/s → moving (60 s)
      { lat: 46.001, lon: 0, t: 660 }, //   0 m/s     → not moving
      { lat: 46.002, lon: 0, t: 1260 }, // ~0.19 m/s  → not moving
      { lat: 46.003, lon: 0, t: 1320 }, // ~1.85 m/s  → moving (60 s)
    ];
    const data = expectOk(convert(gpxDoc(trk([pts]))));
    expect(data.hikeStats.durationMovingSeconds).toBe(120);
    expect(data.hikeStats.durationSeconds).toBe(1320);
  });

  it('computes average pace (total and moving) in seconds per km', () => {
    const pts: Pt[] = [
      { lat: 46.0, lon: 0, t: 0 },
      { lat: 46.001, lon: 0, t: 60 },
      { lat: 46.001, lon: 0, t: 360 }, // 5 min break
      { lat: 46.002, lon: 0, t: 420 },
    ];
    const data = expectOk(convert(gpxDoc(trk([pts]))));
    const km = (2 * STEP_M) / 1000;

    expect(data.hikeStats.avgPaceSecondsPerKm).toBeCloseTo(420 / km, 3);
    expect(data.hikeStats.avgPaceMovingSecondsPerKm).toBeCloseTo(120 / km, 3);
  });

  it('min pace is the fastest interval and max pace the slowest', () => {
    const pts: Pt[] = [
      { lat: 46.0, lon: 0, t: 0 },
      { lat: 46.001, lon: 0, t: 60 }, //  fast: 60 s per step
      { lat: 46.002, lon: 0, t: 240 }, // slow: 180 s per step
      { lat: 46.003, lon: 0, t: 360 }, // mid: 120 s per step
    ];
    const data = expectOk(convert(gpxDoc(trk([pts]))));
    const stepKm = STEP_M / 1000;

    expect(data.hikeStats.minPaceSecondsPerKm).toBeCloseTo(60 / stepKm, 3);
    expect(data.hikeStats.maxPaceSecondsPerKm).toBeCloseTo(180 / stepKm, 3);
  });
});

// ---------------------------------------------------------------------------
// Elevation
// ---------------------------------------------------------------------------

describe('hike stats — elevation', () => {
  const withEle = (eles: (number | undefined)[]) =>
    convert(gpxDoc(trk([walk(eles.length, { ele: (i) => eles[i] })])));

  it('computes gain and loss for changes larger than the smoothing tolerance', () => {
    const data = expectOk(withEle([1000, 1010, 1020, 1010]));
    expect(data.hikeStats.elevationGainMeters).toBeCloseTo(20, 6);
    expect(data.hikeStats.elevationLossMeters).toBeCloseTo(10, 6);
  });

  it('a steady climb is not altered by smoothing', () => {
    const data = expectOk(withEle([1000, 1100, 1200, 1300, 1400]));
    expect(data.hikeStats.elevationGainMeters).toBeCloseTo(400, 6);
    expect(data.hikeStats.elevationLossMeters).toBeCloseTo(0, 6);
  });

  it('smoothing reduces gain from small GPS jitter', () => {
    // Raw gain would be 4 m from ±2 m noise around a flat 1000 m
    const data = expectOk(withEle([1000, 1002, 1000, 1002, 1000]));
    expect(data.hikeStats.elevationGainMeters).toBeLessThan(4);
  });

  it('gain minus loss equals net elevation change', () => {
    const eles = [1000, 1003, 1001, 1020, 1018, 1050, 1049, 1030];
    const data = expectOk(withEle(eles));
    const net = data.hikeStats.elevationGainMeters - data.hikeStats.elevationLossMeters;
    expect(net).toBeCloseTo(eles[eles.length - 1] - eles[0], 6);
  });

  it('max / min elevation are the raw recorded extremes, not smoothed values', () => {
    // 1003 is within the 5 m tolerance and would be smoothed down to 1001
    const data = expectOk(withEle([1000, 1003, 1000]));
    expect(data.hikeStats.elevationMaxMeters).toBe(1003);
    expect(data.hikeStats.elevationMinMeters).toBe(1000);
  });

  it('points without <ele> are ignored for elevation (not treated as 0 m)', () => {
    const data = expectOk(withEle([1500, undefined, 1500, 1520]));
    expect(data.hikeStats.elevationGainMeters).toBeCloseTo(20, 6);
    expect(data.hikeStats.elevationLossMeters).toBeCloseTo(0, 6);
    expect(data.hikeStats.elevationMinMeters).toBe(1500);
    expect(data.hikeStats.elevationMaxMeters).toBe(1520);
  });

  it('points without <ele> still count for distance and time', () => {
    const data = expectOk(withEle([1500, undefined, 1500]));
    expect(data.hikeStats.distanceMeters).toBeCloseTo(2 * STEP_M, 3);
    expect(data.hikeStats.durationSeconds).toBe(120);
    expect(data.segments[0][1].elevationMeters).toBeUndefined();
  });

  it('does not count elevation change across the gap between segments', () => {
    const seg1 = walk(2, { ele: () => 1000 });
    const seg2 = walk(2, { startLat: 46.01, startT: 3600, ele: () => 1500 });
    const data = expectOk(convert(gpxDoc(trk([seg1, seg2]))));
    expect(data.hikeStats.elevationGainMeters).toBeCloseTo(0, 6);
    expect(data.hikeStats.elevationLossMeters).toBeCloseTo(0, 6);
    expect(data.hikeStats.elevationMinMeters).toBe(1000);
    expect(data.hikeStats.elevationMaxMeters).toBe(1500);
  });
});

// ---------------------------------------------------------------------------
// Heart rate / cadence / temperature (only reachable via TrackPoints directly)
// ---------------------------------------------------------------------------

describe('generate_gpx_hike_stats — sensor data', () => {
  it('includes every point (also the first of each segment) in heart rate stats', () => {
    const seg = [tp(46, 0, { heartRate: 100 }), tp(46.001, 60, { heartRate: 120 }), tp(46.002, 120, { heartRate: 140 })];
    const result = generate_gpx_hike_stats([seg]);
    if (!result.success) throw new Error(result.error.message);

    expect(result.data.avgHeartRate).toBe(120);
    expect(result.data.minHeartRate).toBe(100);
    expect(result.data.maxHeartRate).toBe(140);
  });

  it('includes every point in cadence stats', () => {
    const seg = [tp(46, 0, { cadence: 50 }), tp(46.001, 60, { cadence: 60 }), tp(46.002, 120, { cadence: 70 })];
    const result = generate_gpx_hike_stats([seg]);
    if (!result.success) throw new Error(result.error.message);

    expect(result.data.avgCadence).toBe(60);
    expect(result.data.minCadence).toBe(50);
    expect(result.data.maxCadence).toBe(70);
  });

  it('includes every point in the average temperature', () => {
    const seg = [tp(46, 0, { temperature: 10 }), tp(46.001, 60, { temperature: 20 }), tp(46.002, 120, { temperature: 30 })];
    const result = generate_gpx_hike_stats([seg]);
    if (!result.success) throw new Error(result.error.message);

    expect(result.data.averageTemperatureCelsius).toBe(20);
  });

  it('leaves sensor stats undefined when no point has them', () => {
    const result = generate_gpx_hike_stats([[tp(46, 0), tp(46.001, 60)]]);
    if (!result.success) throw new Error(result.error.message);

    expect(result.data.avgHeartRate).toBeUndefined();
    expect(result.data.minHeartRate).toBeUndefined();
    expect(result.data.maxHeartRate).toBeUndefined();
    expect(result.data.avgCadence).toBeUndefined();
    expect(result.data.averageTemperatureCelsius).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// parse_gpx (File entry point)
// ---------------------------------------------------------------------------

describe('parse_gpx', () => {
  it('reads a File and returns a NormalizedActivity', async () => {
    const file = new File([gpxDoc(trk([walk(3)]), '<metadata><name>From file</name></metadata>')], 'hike.gpx');
    const result = await parse_gpx(file);
    if (!result.success) throw new Error(result.error.message);

    expect(result.data.suggestedName).toBe('From file');
    expect(result.data.hikeStats.distanceMeters).toBeCloseTo(2 * STEP_M, 3);
  });

  it('propagates parse errors', async () => {
    const result = await parse_gpx(new File(['<kml/>'], 'x.gpx'));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe(GpxError.NO_GPX_ROOT.code);
  });

  it('returns FAILED_TO_READ_FILE when reading the file throws', async () => {
    const broken = { text: () => Promise.reject(new Error('disk on fire')) } as unknown as File;
    const result = await parse_gpx(broken);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe(GpxError.FAILED_TO_READ_FILE.code);
  });
});

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

describe('GpxError translations', () => {
  const lookup = (obj: unknown, path: string): unknown =>
    path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);

  for (const lang of ['de', 'en']) {
    describe(lang, () => {
      const translations = JSON.parse(readFileSync(resolve(process.cwd(), `public/i18n/${lang}.json`), 'utf8'));

      for (const def of Object.values(GpxError)) {
        it(`${def.code} → "${def.userMessage}" is a translated string`, () => {
          expect(typeof lookup(translations, def.userMessage)).toBe('string');
        });
      }
    });
  }
});
