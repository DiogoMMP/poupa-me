import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogRequest {
  message: string;
  title?: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'danger';
}

export interface ConfirmDialogOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

/**
 * Serviço global de confirmação, usado como alternativa ao `confirm()` nativo do browser.
 * Segue o mesmo padrão do NotificationService: um signal com o pedido atual, exibido por
 * `<app-confirm-dialog>` montado no layout.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly request = signal<ConfirmDialogRequest | null>(null);

  private resolver: ((result: boolean) => void) | null = null;

  confirm(message: string, options?: ConfirmDialogOptions): Promise<boolean> {
    this.request.set({
      message,
      title: options?.title,
      confirmText: options?.confirmText ?? 'Confirmar',
      cancelText: options?.cancelText ?? 'Cancelar',
      variant: options?.variant ?? 'default'
    });

    return new Promise<boolean>(resolve => {
      this.resolver = resolve;
    });
  }

  resolve(result: boolean): void {
    this.resolver?.(result);
    this.resolver = null;
    this.request.set(null);
  }
}
