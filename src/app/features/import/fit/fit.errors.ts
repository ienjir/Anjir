import { defineErrors } from '@core/error/define-errors';

export const FitError = defineErrors('FIT', {
  NOT_VLD: {
    message: 'Not a valid fit file',
    userMessage: 'err.fit.not_valid'
  },
  CRPT: {
    message: 'Fit file is corrupted',
    userMessage: 'err.fit.file_corrupted'
  },
  READ: {
    message: 'One or multiple errors occured when reading fit file',
    userMessage: 'err.fit.read_error'
  },
  NO_DISTANCE_DATA: {
    message: 'The fit file does not contain any data about distance',
    userMessage: 'err.fit.no_distance'
  },
  NO_RECORD_MESG: {
    message: 'No record messages on fit file',
    userMessage: 'err.fit.no_record_mesg'
  },
  NO_SESSION_MESG: {
    message: 'No session messages on fit file',
    userMessage: 'err.fit.no_session_mesg'
  }
});
