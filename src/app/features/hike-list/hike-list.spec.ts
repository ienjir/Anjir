import { ComponentFixture, TestBed } from '@angular/core/testing';
import HikeList from './hike-list';

describe('HikeList', () => {
  let component: HikeList;
  let fixture: ComponentFixture<HikeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HikeList],
    }).compileComponents();

    fixture = TestBed.createComponent(HikeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('p')?.textContent).toContain('hike-list works!');
  });
});
