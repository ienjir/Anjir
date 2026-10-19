import { RawGpx } from "./gpx.model";

export type RawFileType = 'gpx' | 'fit';

export interface RawFile {
  id: string
  hikeId?: string
  plannedHikeId?: string
  type: RawFileType
  filename: string
  data: Blob
  importedAt: Date
}
