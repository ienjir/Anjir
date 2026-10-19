import Dexie, { type EntityTable } from 'dexie';
import { Hike } from '../../models/hike.model';
import { PlannedHike } from '../../models/planned-hike.model';
import { RawFile } from '../../models/raw-file.model';
import { TrackData } from '@models/track.model';

const db = new Dexie('Anjir') as Dexie & {
  hikes: EntityTable<Hike, 'id'>;
  plannedHikes: EntityTable<PlannedHike, 'id'>;
  rawFiles: EntityTable<RawFile, 'id'>;
  tracks: EntityTable<TrackData, 'hikeId'>;
}

db.version(1).stores({
  hikes: 'id, name, date',
  tracks: 'id, hikeId',
  rawFiles: 'id, hikeId',
  plannedHikes: 'id, name, linkedHikeId',
});

export { db }
