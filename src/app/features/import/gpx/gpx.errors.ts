import { defineErrors } from '@core/error/define-errors';

export const GpxError = defineErrors('GPX', {
  NO_ROUTES: {
    message: 'GPX file contains no <rte> elements',
    userMessage: 'err.gpx.gpx_none_or_too_many_tracks',
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
});
