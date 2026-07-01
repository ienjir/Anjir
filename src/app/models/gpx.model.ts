import { TrackPoint } from './track.model';
import { Waypoint } from './planned-hike.model';

export interface NormalizedActivity {
  points: TrackPoint[];
  source: 'track' | 'route';
  hasTimestamps: boolean;
  startTime?: Date;
  endTime?: Date;
  name?: string;
  description?: string;
  waypoints?: Waypoint[];
}

export interface RawGpx {
  gpx: RawGpxRoot;
}

export interface RawGpxRoot {
  xmlns: string;
  version: string;
  creator: string;
  'xmlns:xsi': string;
  'xsi:schemaLocation': string;
  metadata?: RawMetadata;
  wpt?: RawGpxPoint[];
  rte?: RawRoute[];
  trk?: Track[];
  extensions?: unknown;
}

export interface RawMetadata {
  name?: string;
  desc?: string;
  author?: RawAuthor;
  copyright?: RawCopyright;
  link?: RawLink[];
  time?: string;
  keywords?: string;
  bounds?: RawBounds;
}

export interface RawAuthor {
  name?: string;
  email?: RawEmail;
  link?: RawLink[];
}

export interface RawEmail {
  id: string;
  domain: string;
}

export interface RawLink {
  href: string;
  text?: string;
  type?: string;
}

export interface RawCopyright {
  author: string;
  year?: string;
  license?: string;
}

export interface RawBounds {
  minlat: number;
  minlon: number;
  maxlat: number;
  maxlon: number;
}

export interface RawGpxPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
  magvar?: number;
  geoidheight?: number;
  name?: string;
  cmt?: string;
  desc?: string;
  src?: string;
  link?: RawLink[];
  sym?: string;
  type?: string;
  fix?: 'none' | '2d' | '3d' | 'dgps' | 'pps';
  sat?: number;
  hdop?: number;
  vdop?: number;
  pdop?: number;
  ageofdgpsdata?: number;
  dgpsid?: number;
}

export interface RawRoute {
  name?: string;
  cmt?: string;
  desc?: string;
  src?: string;
  link?: RawLink[];
  number?: number;
  type?: string;
  rtept?: RawGpxPoint[];
}

export interface Track {
  name?: string;
  cmt?: string;
  desc?: string;
  src?: string;
  link?: RawLink[];
  number?: number;
  type?: string;
  trkseg?: RawTrackSegment[];
}

export interface RawTrackSegment {
  trkpt?: RawGpxPoint[];
}
