import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

const mockAdd = vi.hoisted(() => vi.fn().mockResolvedValue(1));
const mockToArray = vi.hoisted(() => vi.fn().mockResolvedValue([]));

vi.mock('dexie', () => {
  class MockDexie {
    hikes = { add: mockAdd, toArray: mockToArray };
    plannedHikes = {};
    rawFiles = {};
    version() {
      return { stores: () => ({}) };
    }
  }
  return {
    default: MockDexie,
    liveQuery: (_fn: unknown) => Promise.resolve([]),
  };
});

describe('App', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
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

  it('should call db.hikes.add when addToDb is called', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.addToDb();
    expect(mockAdd).toHaveBeenCalledOnce();
  });

  it('should pass correct shape to db.hikes.add', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.addToDb();
    const [arg] = mockAdd.mock.calls[0];
    expect(arg).toMatchObject({
      name: 'Test',
      stats: expect.objectContaining({
        distanceMeters: 10000,
        durationSeconds: 1000,
      }),
    });
  });
});
