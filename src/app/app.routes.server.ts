import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [{ lang: 'en' }, { lang: 'de' }],
  },
  {
    path: ':lang',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [{ lang: 'en' }, { lang: 'de' }],
  },
  {
    path: ':lang/dashboard',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [{ lang: 'en' }, { lang: 'de' }],
  },
  {
    path: ':lang/neu',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [{ lang: 'en' }, { lang: 'de' }],
  },
  {
    path: ':lang/statistiken',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [{ lang: 'en' }, { lang: 'de' }],
  },

  {
    path: ':lang/touren',
    renderMode: RenderMode.Server,
  },
  {
    path: ':lang/touren/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: ':lang/touren/:id/vergleich/:id',
    renderMode: RenderMode.Server,
  },
];
