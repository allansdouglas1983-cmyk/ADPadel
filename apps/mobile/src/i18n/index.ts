import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import es from './locales/es.json';

/**
 * i18n bootstrap. EN + ES at launch (padel heartland); FR/IT/PT/SV/NL are
 * scaffolded as fast-follow by dropping in more locale files here.
 */
const languageTag = getLocales()[0]?.languageCode ?? 'en';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: languageTag,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
