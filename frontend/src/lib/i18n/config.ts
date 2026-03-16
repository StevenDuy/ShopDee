import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from '../../../public/locales/en/common.json';
import viTranslation from '../../../public/locales/vi/common.json';

const resources = {
  en: {
    common: enTranslation,
  },
  vi: {
    common: viTranslation,
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    defaultNS: 'common',
    ns: ['common'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
