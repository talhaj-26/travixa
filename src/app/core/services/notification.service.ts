import { Injectable, signal } from '@angular/core';

export interface AppNotification { id: number; title: string; message: string; createdAt: string; read: boolean; type: 'info' | 'success' | 'warning'; }

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly storageKey = 'travixa-notifications';
  readonly notifications = signal<AppNotification[]>(this.read());
  readonly unreadCount = () => this.notifications().filter((item) => !item.read).length;

  push(title: string, message: string, type: AppNotification['type'] = 'info'): void {
    this.update([{ id: Date.now(), title, message, type, createdAt: new Date().toISOString(), read: false }, ...this.notifications()]);
  }
  markAllRead(): void { this.update(this.notifications().map((item) => ({ ...item, read: true }))); }
  toggleRead(id: number): void { this.update(this.notifications().map((item) => item.id === id ? { ...item, read: !item.read } : item)); }
  private update(items: AppNotification[]): void { this.notifications.set(items); localStorage.setItem(this.storageKey, JSON.stringify(items)); }
  private read(): AppNotification[] { try { return JSON.parse(localStorage.getItem(this.storageKey) ?? '[]') as AppNotification[]; } catch { return []; } }
}
