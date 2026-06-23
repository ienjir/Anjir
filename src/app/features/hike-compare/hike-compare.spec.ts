import { ComponentFixture, TestBed } from '@angular/core/testing';
import HikeCompare from './hike-compare';

describe('HikeCompare', () => {
  let component: HikeCompare;
  let fixture: ComponentFixture<HikeCompare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HikeCompare],
    }).compileComponents();

    fixture = TestBed.createComponent(HikeCompare);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('p')?.textContent).toContain('hike-compare works!');
  });
});
