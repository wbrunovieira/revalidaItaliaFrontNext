export function normalizeLocale(
  locale: string
): 'pt' | 'es' | 'it' {
  const lower = locale.toLowerCase();

  const mappings: Record<string, 'pt' | 'es' | 'it'> = {
    'pt-br': 'pt',
    pt: 'pt',
    'es-es': 'es',
    'es-mx': 'es',
    es: 'es',
    'it-it': 'it',
    it: 'it',
  };

  return mappings[lower] ?? 'pt';
}
