import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

export const langGuard: CanActivateFn = (route, state) => {
  const translate = inject(TranslateService);
  const lang = route.paramMap.get('lang');

  if (lang) {
    translate.use(lang);
  }

  return true;
};
