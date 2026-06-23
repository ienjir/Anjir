export function gpx_to_hike(gpx_string: string) {
  const dom_parser = new DOMParser();
  const doc = dom_parser.parseFromString(gpx_string, 'application/xml');
}
