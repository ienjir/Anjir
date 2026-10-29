import { ComponentFixture, TestBed } from '@angular/core/testing';
import HikeCreate from './hike-create';

describe('HikeCreate', () => {
  let component: HikeCreate;
  let fixture: ComponentFixture<HikeCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HikeCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(HikeCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('p')?.textContent).toContain('hike-create works!');
  });
});
