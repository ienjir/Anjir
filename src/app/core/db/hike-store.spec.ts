import { TestBed } from '@angular/core/testing';

import { HikeStore } from './hike-store';

describe('HikeStore', () => {
  let service: HikeStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HikeStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
