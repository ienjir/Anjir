export interface RawGpx {
  gpx: GpxRoot;
}

export interface GpxRoot {
  xmlns: string;
  version: string;
  creator: string;
  "xmlns:xsi": string;
  "xsi:schemaLocation": string;
  metadata?: Metadata;
  wpt?: Waypoint[];
  rte?: Route[];
  trk?: Track[];
  extensions?: unknown;
}

export interface Metadata {
  name?: string;
  desc?: string;
  author?: Author;
  copyright?: Copyright;
  link?: Link[];
  time?: string;
  keywords?: string;
  bounds?: Bounds;
}

export interface Author {
  name?: string;
  email?: Email;
  link?: Link[];
}

export interface Email {
  id: string;
  domain: string;
}

export interface Link {
  href: string;
  text?: string;
  type?: string;
}

export interface Copyright {
  author: string;
  year?: string;
  license?: string;
}

export interface Bounds {
  minlat: number;
  minlon: number;
  maxlat: number;
  maxlon: number;
}

export interface Waypoint {
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
  link?: Link[];
  sym?: string;
  type?: string;
  fix?: "none" | "2d" | "3d" | "dgps" | "pps";
  sat?: number;
  hdop?: number;
  vdop?: number;
  pdop?: number;
  ageofdgpsdata?: number;
  dgpsid?: number;
}

export interface Route {
  name?: string;
  cmt?: string;
  desc?: string;
  src?: string;
  link?: Link[];
  number?: number;
  type?: string;
  rtept?: Waypoint[];
}

export interface Track {
  name?: string;
  cmt?: string;
  desc?: string;
  src?: string;
  link?: Link[];
  number?: number;
  type?: string;
  trkseg?: TrackSegment[];
}

export interface TrackSegment {
  trkpt?: Waypoint[];
}
