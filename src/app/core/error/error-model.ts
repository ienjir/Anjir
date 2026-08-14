type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E };

interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  cause?: unknown;
}

const errorDefs = {
  GPX_NO_ROUTES: {
    message: 'GPX file contains no <rte> elements',
    userMessage: 'err.gpx.gpx_none_or_too_many_tracks',
  },
  GPX_NO_TRKSEG: {
    message: 'Track contains no <trkseg> elements',
    userMessage: 'err.gpx.gpx_no_track_seg_on_track',
  },
  GPX_NO_TRKPNT: {
    message: 'Track segment contains no <trkpt> elements',
    userMessage: 'err.gpx.gpx_no_track_points_on_trackseg'
  },
  GPX_EMPTY_SEG: {
    message: 'Track segment is empty',
    userMessage: 'err.gpx.gpx_empty_segment'
  },
  GPX_UND_TRKPNT: {
    message: 'Track point is undefined',
    userMessage: 'err.gpx.gpx_trackpoint_is_undefined'
  },
  GPX_NO_TMPSTMP: {
    message: 'Track point has no <time> element',
    userMessage: 'err.gpx.gpx_no_timestamp'
  },
  GPX_NO_VLD_TRK_DTA: {
    message: 'No valid track data found',
    userMessage: 'err.gpx_no_valid_track_data'
  },
  FIT_NOT_VLD: {
    message: 'Not a valid fit file',
    userMessage: 'err.fit.not_valid'
  },
  FIT_CRPT: {
    message: 'Fit file is corrupted',
    userMessage: 'err.fit.file_corrupted'
  },
  FIT_READ: {
    message: 'One or multiple errors occured when reading fit file',
    userMessage: 'err.fit.read_error'
  },
  FIT_NO_DISTANCE_DATA: {
    message: 'The fit file does not contain any data about distance',
    userMessage: 'err.fit.no_distance'
  },
  FIT_NO_RECORD_MESG: {
    message: 'No record messages on fit file',
    userMessage: 'err.fit.no_record_mesg'
  },
  FIT_NO_SESSION_MESG: {
    message: 'No session messages on fit file',
    userMessage: 'err.fit.no_session_mesg'
  }

} satisfies Record<string, { message: string; userMessage: string }>;

type ErrorCode = keyof typeof errorDefs;

function makeError(code: ErrorCode, cause?: unknown): AppError {
  const def = errorDefs[code];
  return { code, message: def.message, userMessage: def.userMessage, cause };
}
