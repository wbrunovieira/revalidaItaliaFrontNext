// src/lib/slug.ts

/**
 * Gera um slug a partir de um texto
 * - Remove acentos
 * - Converte para minúsculas
 * - Substitui espaços por hífens
 * - Remove caracteres especiais
 * - Remove hífens múltiplos
 * - Remove hífens do início e fim
 * - Limita o tamanho
 *
 * @param text - Texto para converter em slug
 * @param maxLength - Tamanho máximo do slug (padrão: 50)
 * @returns Slug formatado
 */
export function generateSlug(
  text: string,
  maxLength: number = 50
): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens múltiplos
    .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
    .slice(0, maxLength); // Limita o tamanho
}

/**
 * Valida se um slug está no formato correto
 *
 * @param slug - Slug para validar
 * @returns true se o slug é válido
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 50) {
    return false;
  }

  // Deve conter apenas letras minúsculas, números e hífens
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return false;
  }

  // Não pode começar ou terminar com hífen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return false;
  }

  // Não pode ter hífens duplos
  if (slug.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Formata um slug enquanto o usuário digita
 * Remove caracteres inválidos e aplica formatação básica
 *
 * @param input - Texto digitado pelo usuário
 * @returns Slug formatado parcialmente
 */
export function formatSlugInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
