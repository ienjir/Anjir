import { XMLParser } from 'fast-xml-parser';
import { Hike } from '../models/hike.model';

export function gpx_to_hike(gpx_string: string) {
  const xml_parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: true,
    parseTagValue: true,
    isArray: (tag) => ["wpt", "rte", "trk", "trkseg", "trkpt", "rtept", "link"].includes(tag)
  });

  const result = xml_parser.parse(gpx_string);

  let hike: Hike = result



}
