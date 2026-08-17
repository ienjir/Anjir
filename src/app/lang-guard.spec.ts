import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { langGuard } from './lang-guard';

describe('langGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => langGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
