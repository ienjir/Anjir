import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show maintenance page when maintenance signal is true', async () => {
    const fixture = TestBed.createComponent(App);
    (fixture.componentInstance as any).maintenance.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-maintenance')).not.toBeNull();
    expect(el.querySelector('nav')).toBeNull();
  });

  it('should show nav and router-outlet when maintenance signal is false', async () => {
    const fixture = TestBed.createComponent(App);
    (fixture.componentInstance as any).maintenance.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('nav')).not.toBeNull();
    expect(el.querySelector('router-outlet')).not.toBeNull();
  });
});
