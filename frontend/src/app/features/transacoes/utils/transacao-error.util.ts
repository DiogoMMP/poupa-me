import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mensagens de erro do backend (em inglês, formato interno de `Result.fail`) conhecidas e mapeadas
 * para uma mensagem clara em PT-PT para o utilizador.
 */
const KNOWN_ERROR_MESSAGES: Record<string, string> = {
  'Invalid date or date is in the future': 'A data não pode ser uma data futura.',
};

/**
 * Traduz o corpo de um erro HTTP de Transação para uma mensagem PT-PT, quando reconhecido.
 * Cai para `fallback` em qualquer outro caso (erro de rede, mensagem desconhecida, etc.).
 */
export function mapTransacaoErrorMessage(err: unknown, fallback: string): string {
  const backendMessage = err instanceof HttpErrorResponse ? err.error?.error : undefined;
  return (backendMessage && KNOWN_ERROR_MESSAGES[backendMessage]) || fallback;
}
