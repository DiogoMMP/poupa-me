import { Injectable, signal } from '@angular/core';

export type Notification = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timeout?: number; // ms
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  // public signal list of notifications
  notifications = signal<Notification[]>([]);

  private makeId() {
    return Math.random().toString(36).slice(2, 9);
  }

  show(message: string, type: Notification['type'] = 'info', timeout = 5000) {
    const id = this.makeId();
    const n: Notification = { id, type, message, timeout };
    this.notifications.set([...(this.notifications() || []), n]);
    if (timeout && timeout > 0) {
      setTimeout(() => this.dismiss(id), timeout);
    }
    return id;
  }

  success(message: string, timeout = 4000) {
    return this.show(message, 'success', timeout);
  }

  error(message: string, timeout = 7000) {
    return this.show(message, 'error', timeout);
  }

  info(message: string, timeout = 4000) {
    return this.show(message, 'info', timeout);
  }

  warning(message: string, timeout = 5000) {
    return this.show(message, 'warning', timeout);
  }

  dismiss(id: string) {
    this.notifications.set((this.notifications() || []).filter(n => n.id !== id));
  }

  clear() {
    this.notifications.set([]);
  }
}
