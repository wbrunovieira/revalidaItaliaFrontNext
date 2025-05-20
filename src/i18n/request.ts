//src/i18n/request.ts

import { getRequestConfig } from 'next-intl/server';

import { headers } from 'next/headers';
import { routing } from './routing';

function parseAcceptLanguage(
  acceptLanguage: string
): string {
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.split(';q=');
      return {
        code: code.trim(),
        q: qValue ? parseFloat(qValue) : 1.0,
      };
    })
    .sort((a, b) => b.q - a.q);
  return languages[0]?.code || '';
}

function isValidLocale(
  lang: string
): lang is 'it' | 'pt' | 'es' {
  return ['it', 'pt', 'es'].includes(lang);
}

export default getRequestConfig(
  async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale) {
      const referer = (await headers()).get('referer');
      if (referer) {
        try {
          const url = new URL(referer);
          const segments = url.pathname.split('/');
          if (
            segments.length > 1 &&
            isValidLocale(segments[1])
          ) {
            locale = segments[1];
          }
        } catch (err) {
          console.error(
            'Erro ao extrair locale da URL:',
            err
          );
        }
      }
    }

    console.log(
      'locale do request antes do tratamento:',
      locale
    );

    if (!locale) {
      const reqHeaders = await headers();
      const acceptLanguage =
        reqHeaders.get('accept-language') || '';
      console.log(
        'accept-language header:',
        acceptLanguage
      );

      const preferred = parseAcceptLanguage(acceptLanguage);
      console.log(
        'preferred language from header:',
        preferred
      );

      if (preferred.toLowerCase().includes('pt')) {
        locale = 'pt';
      } else if (preferred.toLowerCase().includes('it')) {
        locale = 'it';
      } else {
        locale = routing.defaultLocale;
      }
    }

    if (
      locale !== 'it' &&
      locale !== 'pt' &&
      locale !== 'es'
    ) {
      locale = routing.defaultLocale;
    }
    console.log(
      'locale do request após tratamento:',
      locale
    );

    const messages = (
      await (locale === 'pt'
        ? import('../../messages/pt.json')
        : locale === 'es'
        ? import('../../messages/es.json')
        : import('../../messages/it.json'))
    ).default;

    return {
      locale,
      messages,
    };
  }
);
