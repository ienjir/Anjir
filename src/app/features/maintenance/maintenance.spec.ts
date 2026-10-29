import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Maintenance } from './maintenance';

describe('Maintenance', () => {
  let component: Maintenance;
  let fixture: ComponentFixture<Maintenance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Maintenance],
    }).compileComponents();

    fixture = TestBed.createComponent(Maintenance);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the logo image', () => {
    const el = fixture.nativeElement as HTMLElement;
    const img = el.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('Logo-400x400.png');
  });

  it('should render the Maintenance heading', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Maintenance');
  });

  it('should render the maintenance description', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h2')?.textContent).toContain('under maintenance');
  });
});
