import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HikeList } from './hike-list';

describe('HikeList', () => {
  let component: HikeList;
  let fixture: ComponentFixture<HikeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HikeList],
    }).compileComponents();

    fixture = TestBed.createComponent(HikeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
