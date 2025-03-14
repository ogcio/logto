import { configureLocalization } from '@lit/localize';

// Generated via output.localeCodesModule
import { sourceLocale, targetLocales } from '../generated/locale-codes.js';

export const initLocalization = () =>
  configureLocalization({
    sourceLocale,
    targetLocales,
    loadLocale: async (locale) => import(/* @vite-ignore */ `/locales/${locale}.js`),
  });
