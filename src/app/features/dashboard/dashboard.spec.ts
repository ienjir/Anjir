import { ComponentFixture, TestBed } from '@angular/core/testing';
import Dashboard from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('p')?.textContent).toContain('dashboard works!');
  });
});
