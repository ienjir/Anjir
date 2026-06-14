export type RawFileType = 'gpx' | 'fit';

export interface RawFile {
  id?: number
  hikeId: number
  type: RawFileType
  filename: string
  data: Blob
  importedAt: Date
}
