import { defineErrors } from '@core/error/define-errors';

export const GpxError = defineErrors('GPX', {
  NO_GPX_ROOT: {
    message: 'XML file has no <gpx> root element',
    userMessage: 'err.gpx.no_gpx_root',
  },
  NO_TRACKS: {
    message: 'GPX file contains no <trk> elements',
    userMessage: 'err.gpx.no_tracks',
  },
  MULTIPLE_TRACKS: {
    message: 'GPX file contains {count} <trk> elements, only 1 is supported',
    userMessage: 'err.gpx.multiple_tracks',
  },
  NO_TRKSEG: {
    message: 'Track contains no <trkseg> elements',
    userMessage: 'err.gpx.gpx_no_track_seg_on_track',
  },
  NO_TRKPNT: {
    message: 'Track segment contains no <trkpt> elements',
    userMessage: 'err.gpx.gpx_no_track_points_on_trackseg'
  },
  EMPTY_SEG: {
    message: 'Track segment is empty',
    userMessage: 'err.gpx.gpx_empty_segment'
  },
  UND_TRKPNT: {
    message: 'Track point is undefined',
    userMessage: 'err.gpx.gpx_trackpoint_is_undefined'
  },
  NO_TMPSTMP: {
    message: 'Track point has no <time> element',
    userMessage: 'err.gpx.gpx_no_timestamp'
  },
  NO_VLD_TRK_DTA: {
    message: 'No valid track data found',
    userMessage: 'err.gpx_no_valid_track_data'
  },
  MALFORMED_XML: {
    message: 'Malformed GPX on line {line}, col {col}: {reason}',
    userMessage: 'err.gpx.malformed_xml'
  },
  FAILED_TO_READ_FILE: {
    message: 'Failed to read file',
    userMessage: 'err.gpx'
  }
});
