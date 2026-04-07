import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
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
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi',
    fallbackLng: 'vi',
    defaultNS: 'common',
    ns: ['common'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
