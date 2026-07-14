import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import sv from './locales/sv.json';
import nl from './locales/nl.json';

/**
 * i18n bootstrap. EN + ES lead (padel heartland); FR/IT/PT/SV/NL ship as the
 * fast-follow markets, resolved from the device locale with an EN fallback.
 */
const languageTag = getLocales()[0]?.languageCode ?? 'en';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    it: { translation: it },
    pt: { translation: pt },
    sv: { translation: sv },
    nl: { translation: nl },
  },
  lng: languageTag,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
