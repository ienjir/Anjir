import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HikeDetail } from './hike-detail';

describe('HikeDetail', () => {
  let component: HikeDetail;
  let fixture: ComponentFixture<HikeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HikeDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(HikeDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
