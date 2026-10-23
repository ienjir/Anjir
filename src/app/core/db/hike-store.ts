import { Injectable } from '@angular/core';
import { db } from '@core/db/db';
import { Hike } from '@models/hike.model';
import { RawFile } from '@models/raw-file.model';
import { TrackData } from '@models/track.model';

@Injectable({
  providedIn: 'root',
})
export class HikeStore {
  async saveHike(hike: Hike, track: TrackData, rawFile: RawFile): Promise<void> {
    await db.transaction('rw', db.hikes, db.tracks, db.rawFiles, async () => {
      await db.hikes.add(hike);
      await db.tracks.add(track);
      await db.rawFiles.add(rawFile);
    });
  }

  async deleteHike(hikeId: string): Promise<void> {
    await db.transaction('rw', db.hikes, db.tracks, db.rawFiles, async () => {
      await db.tracks.where(hikeId).equals(hikeId).delete();
      await db.rawFiles.where(hikeId).equals(hikeId).delete();
      await db.hikes.delete(hikeId);
    });
  }
}
