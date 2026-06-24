import { SyntaxValidator } from 'fast-xml-validator';
import { XMLParser } from 'fast-xml-parser';
import { RawGpx } from '../models/gpx.model';
import { Hike } from '../models/hike.model';

export function gpx_string_to_raw_gpx(gpx_string: string): RawGpx {
  const validation = SyntaxValidator.validate(gpx_string);
  if (validation !== true) throw new Error(`Invalid XML: ${validation.err.msg}`);

  const xml_parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: true,
    parseTagValue: true,
    isArray: (tag) => ["wpt", "rte", "trk", "trkseg", "trkpt", "rtept", "link"].includes(tag)
  });

  const result = xml_parser.parse(gpx_string);
  if (!result?.gpx) throw new Error("Invalid GPX: missing root <gpx> element");

  const raw_gpx: RawGpx = result;

  return raw_gpx;
}

export function raw_gpx_to_hike(raw_gpx: RawGpx): Hike {

}
