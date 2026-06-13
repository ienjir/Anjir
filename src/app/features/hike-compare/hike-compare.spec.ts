import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HikeCompare } from './hike-compare';

describe('HikeCompare', () => {
  let component: HikeCompare;
  let fixture: ComponentFixture<HikeCompare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HikeCompare],
    }).compileComponents();

    fixture = TestBed.createComponent(HikeCompare);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
