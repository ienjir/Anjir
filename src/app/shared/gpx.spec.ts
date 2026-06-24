import { gpx_to_hike } from "./gpx";
import { RawGpx } from "../models/gpx.model";

// ─── Helpers ────────────────────────────────────────────────────────────────

function wrap(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1"
     version="1.1"
     creator="TestSuite"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  ${inner}
</gpx>`;
}

const MINIMAL_GPX = wrap("");

const FULL_METADATA_GPX = wrap(`
  <metadata>
    <name>Test Hike</name>
    <desc>A test description</desc>
    <author>
      <name>Jane Doe</name>
      <email id="jane" domain="example.com"/>
      <link href="https://example.com"><text>Jane's Site</text><type>text/html</type></link>
    </author>
    <copyright author="OSM">
      <year>2024</year>
      <license>https://openstreetmap.org/license</license>
    </copyright>
    <link href="https://example.com/hike"><text>Hike Page</text></link>
    <time>2024-06-01T08:00:00Z</time>
    <keywords>hiking, test</keywords>
    <bounds minlat="47.0" minlon="8.0" maxlat="48.0" maxlon="9.0"/>
  </metadata>
`);

const TRACK_GPX = wrap(`
  <trk>
    <name>Main Track</name>
    <trkseg>
      <trkpt lat="47.1" lon="8.1"><ele>500</ele><time>2024-06-01T08:00:00Z</time></trkpt>
      <trkpt lat="47.2" lon="8.2"><ele>600</ele><time>2024-06-01T09:00:00Z</time></trkpt>
    </trkseg>
  </trk>
`);

const MULTI_SEGMENT_TRACK_GPX = wrap(`
  <trk>
    <name>Multi-Seg</name>
    <trkseg>
      <trkpt lat="47.1" lon="8.1"><ele>500</ele></trkpt>
    </trkseg>
    <trkseg>
      <trkpt lat="47.3" lon="8.3"><ele>700</ele></trkpt>
    </trkseg>
  </trk>
`);

const MULTI_TRACK_GPX = wrap(`
  <trk><name>Track 1</name><trkseg><trkpt lat="47.1" lon="8.1"/></trkseg></trk>
  <trk><name>Track 2</name><trkseg><trkpt lat="48.1" lon="9.1"/></trkseg></trk>
`);

const ROUTE_GPX = wrap(`
  <rte>
    <name>My Route</name>
    <rtept lat="47.1" lon="8.1"><ele>500</ele><name>Start</name></rtept>
    <rtept lat="47.2" lon="8.2"><ele>600</ele><name>End</name></rtept>
  </rte>
`);

const WAYPOINT_GPX = wrap(`
  <wpt lat="47.5" lon="8.5">
    <ele>750</ele>
    <time>2024-06-01T10:00:00Z</time>
    <name>Summit</name>
    <desc>The highest point</desc>
    <sym>Flag</sym>
    <type>Summit</type>
    <fix>3d</fix>
    <sat>8</sat>
    <hdop>1.2</hdop>
  </wpt>
`);

const MULTI_WAYPOINT_GPX = wrap(`
  <wpt lat="47.1" lon="8.1"><name>A</name></wpt>
  <wpt lat="47.2" lon="8.2"><name>B</name></wpt>
`);

const FULL_GPX = wrap(`
  <metadata><name>Full GPX</name></metadata>
  <wpt lat="47.0" lon="8.0"><name>Parking</name></wpt>
  <rte><name>Approach</name><rtept lat="47.0" lon="8.0"/></rte>
  <trk>
    <name>Summit Track</name>
    <trkseg>
      <trkpt lat="47.1" lon="8.1"><ele>900</ele></trkpt>
      <trkpt lat="47.2" lon="8.2"><ele>1200</ele></trkpt>
    </trkseg>
  </trk>
`);

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("gpx_to_hike", () => {

  // ── Return shape ───────────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns a RawGpx object with a gpx root key", () => {
      const result: RawGpx = gpx_to_hike(MINIMAL_GPX);
      expect(result).toBeDefined();
      expect(result.gpx).toBeDefined();
    });

    it("parses required GPX root attributes", () => {
      const { gpx } = gpx_to_hike(MINIMAL_GPX);
      expect(gpx.xmlns).toBe("http://www.topografix.com/GPX/1/1");
      expect(gpx.version).toBe(1.1);
      expect(gpx.creator).toBe("TestSuite");
      expect(gpx["xmlns:xsi"]).toBe("http://www.w3.org/2001/XMLSchema-instance");
      expect(gpx["xsi:schemaLocation"]).toContain("http://www.topografix.com/GPX/1/1");
    });

    it("leaves optional fields undefined when absent", () => {
      const { gpx } = gpx_to_hike(MINIMAL_GPX);
      expect(gpx.metadata).toBeUndefined();
      expect(gpx.wpt).toBeUndefined();
      expect(gpx.rte).toBeUndefined();
      expect(gpx.trk).toBeUndefined();
    });
  });

  // ── Metadata ───────────────────────────────────────────────────────────────

  describe("metadata", () => {
    it("parses basic metadata fields", () => {
      const { gpx } = gpx_to_hike(FULL_METADATA_GPX);
      expect(gpx.metadata?.name).toBe("Test Hike");
      expect(gpx.metadata?.desc).toBe("A test description");
      expect(gpx.metadata?.time).toBe("2024-06-01T08:00:00Z");
      expect(gpx.metadata?.keywords).toBe("hiking, test");
    });

    it("parses metadata author with email and link", () => {
      const author = gpx_to_hike(FULL_METADATA_GPX).gpx.metadata?.author;
      expect(author?.name).toBe("Jane Doe");
      expect(author?.email?.id).toBe("jane");
      expect(author?.email?.domain).toBe("example.com");
      expect(author?.link?.[0]?.href).toBe("https://example.com");
      expect(author?.link?.[0]?.text).toBe("Jane's Site");
      expect(author?.link?.[0]?.type).toBe("text/html");
    });

    it("parses metadata copyright", () => {
      const copyright = gpx_to_hike(FULL_METADATA_GPX).gpx.metadata?.copyright;
      expect(copyright?.author).toBe("OSM");
      expect(copyright?.year).toBe(2024);
      expect(copyright?.license).toBe("https://openstreetmap.org/license");
    });

    it("parses metadata bounds as numbers", () => {
      const bounds = gpx_to_hike(FULL_METADATA_GPX).gpx.metadata?.bounds;
      expect(bounds?.minlat).toBe(47.0);
      expect(bounds?.minlon).toBe(8.0);
      expect(bounds?.maxlat).toBe(48.0);
      expect(bounds?.maxlon).toBe(9.0);
    });

    it("parses metadata link as an array", () => {
      const links = gpx_to_hike(FULL_METADATA_GPX).gpx.metadata?.link;
      expect(Array.isArray(links)).toBe(true);
      expect(links?.[0]?.href).toBe("https://example.com/hike");
    });
  });

  // ── Tracks ─────────────────────────────────────────────────────────────────

  describe("tracks (trk)", () => {
    it("parses a single track", () => {
      const { gpx } = gpx_to_hike(TRACK_GPX);
      expect(Array.isArray(gpx.trk)).toBe(true);
      expect(gpx.trk).toHaveLength(1);
      expect(gpx.trk![0].name).toBe("Main Track");
    });

    it("parses multiple tracks as an array", () => {
      const { gpx } = gpx_to_hike(MULTI_TRACK_GPX);
      expect(gpx.trk).toHaveLength(2);
      expect(gpx.trk![0].name).toBe("Track 1");
      expect(gpx.trk![1].name).toBe("Track 2");
    });

    it("parses track segments as an array", () => {
      const segs = gpx_to_hike(TRACK_GPX).gpx.trk![0].trkseg;
      expect(Array.isArray(segs)).toBe(true);
      expect(segs).toHaveLength(1);
    });

    it("parses multiple track segments", () => {
      const segs = gpx_to_hike(MULTI_SEGMENT_TRACK_GPX).gpx.trk![0].trkseg;
      expect(segs).toHaveLength(2);
    });

    it("parses track points with lat/lon as numbers", () => {
      const trkpt = gpx_to_hike(TRACK_GPX).gpx.trk![0].trkseg![0].trkpt![0];
      expect(trkpt.lat).toBe(47.1);
      expect(trkpt.lon).toBe(8.1);
    });

    it("parses track point elevation as a number", () => {
      const trkpt = gpx_to_hike(TRACK_GPX).gpx.trk![0].trkseg![0].trkpt![0];
      expect(trkpt.ele).toBe(500);
    });

    it("parses track point time as a string", () => {
      const trkpt = gpx_to_hike(TRACK_GPX).gpx.trk![0].trkseg![0].trkpt![0];
      expect(trkpt.time).toBe("2024-06-01T08:00:00Z");
    });

    it("parses multiple track points per segment", () => {
      const trkpts = gpx_to_hike(TRACK_GPX).gpx.trk![0].trkseg![0].trkpt;
      expect(trkpts).toHaveLength(2);
    });
  });

  // ── Routes ─────────────────────────────────────────────────────────────────

  describe("routes (rte)", () => {
    it("parses a single route as an array", () => {
      const { gpx } = gpx_to_hike(ROUTE_GPX);
      expect(Array.isArray(gpx.rte)).toBe(true);
      expect(gpx.rte).toHaveLength(1);
      expect(gpx.rte![0].name).toBe("My Route");
    });

    it("parses route points with lat/lon as numbers", () => {
      const rtept = gpx_to_hike(ROUTE_GPX).gpx.rte![0].rtept![0];
      expect(rtept.lat).toBe(47.1);
      expect(rtept.lon).toBe(8.1);
    });

    it("parses route point elevation and name", () => {
      const rtept = gpx_to_hike(ROUTE_GPX).gpx.rte![0].rtept![0];
      expect(rtept.ele).toBe(500);
      expect(rtept.name).toBe("Start");
    });

    it("parses multiple route points as an array", () => {
      const rtepts = gpx_to_hike(ROUTE_GPX).gpx.rte![0].rtept;
      expect(rtepts).toHaveLength(2);
    });
  });

  // ── Waypoints ──────────────────────────────────────────────────────────────

  describe("waypoints (wpt)", () => {
    it("parses a single waypoint as an array", () => {
      const { gpx } = gpx_to_hike(WAYPOINT_GPX);
      expect(Array.isArray(gpx.wpt)).toBe(true);
      expect(gpx.wpt).toHaveLength(1);
    });

    it("parses waypoint lat/lon as numbers", () => {
      const wpt = gpx_to_hike(WAYPOINT_GPX).gpx.wpt![0];
      expect(wpt.lat).toBe(47.5);
      expect(wpt.lon).toBe(8.5);
    });

    it("parses all common waypoint fields", () => {
      const wpt = gpx_to_hike(WAYPOINT_GPX).gpx.wpt![0];
      expect(wpt.ele).toBe(750);
      expect(wpt.time).toBe("2024-06-01T10:00:00Z");
      expect(wpt.name).toBe("Summit");
      expect(wpt.desc).toBe("The highest point");
      expect(wpt.sym).toBe("Flag");
      expect(wpt.type).toBe("Summit");
    });

    it("parses waypoint fix as a string literal", () => {
      const wpt = gpx_to_hike(WAYPOINT_GPX).gpx.wpt![0];
      expect(wpt.fix).toBe("3d");
    });

    it("parses waypoint GPS accuracy fields as numbers", () => {
      const wpt = gpx_to_hike(WAYPOINT_GPX).gpx.wpt![0];
      expect(wpt.sat).toBe(8);
      expect(wpt.hdop).toBe(1.2);
    });

    it("parses multiple waypoints as an array", () => {
      const { gpx } = gpx_to_hike(MULTI_WAYPOINT_GPX);
      expect(gpx.wpt).toHaveLength(2);
      expect(gpx.wpt![0].name).toBe("A");
      expect(gpx.wpt![1].name).toBe("B");
    });
  });

  // ── Combined ───────────────────────────────────────────────────────────────

  describe("combined GPX (metadata + wpt + rte + trk)", () => {
    it("parses all sections together without interference", () => {
      const { gpx } = gpx_to_hike(FULL_GPX);
      expect(gpx.metadata?.name).toBe("Full GPX");
      expect(gpx.wpt).toHaveLength(1);
      expect(gpx.rte).toHaveLength(1);
      expect(gpx.trk).toHaveLength(1);
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  describe("error handling", () => {
    it("throws or returns a meaningful error for empty string", () => {
      expect(() => gpx_to_hike("")).toThrow();
    });

    it("throws or returns a meaningful error for invalid XML", () => {
      expect(() => gpx_to_hike("<gpx><unclosed>")).toThrow();
    });

    it("throws or returns a meaningful error for valid XML that is not GPX", () => {
      expect(() => gpx_to_hike("<root><item/></root>")).toThrow();
    });
  });
});
