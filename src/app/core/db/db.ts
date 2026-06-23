import Dexie, { type EntityTable } from 'dexie';
import { Hike } from '../../models/hike.model';
import { PlannedHike } from '../../models/planned-hike.model';
import { RawFile } from '../../models/raw-file.model';

const db = new Dexie('Anjir') as Dexie & {
  hikes: EntityTable<Hike, 'id'>;
  plannedHikes: EntityTable<PlannedHike, 'id'>;
  rawFiles: EntityTable<RawFile, 'id'>;
}

db.version(1).stores({
  hikes: '++id, name',
  plannedHikes: '++id, name, linkedHikeId',
  rawFiles: '++id, hikeId'
})

export { db }
