import { Injectable, signal } from '@angular/core';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast data structure
 */
export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

/**
 * TRAVIXA Toast Service
 * ---------------------
 * Central service for showing toast notifications across the app.
 *
 * Usage:
 *   toast.success('Saved!', 'Your changes were saved');
 *   toast.error('Failed', 'Something went wrong');
 *   toast.warning('Careful', 'This action is permanent');
 *   toast.info('Heads up', 'New update available');
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private counter = 0;

  /**
   * Show a toast notification
   */
  show(
    type: ToastType,
    title: string,
    message?: string,
    duration = 4000,
  ): void {
    const id = ++this.counter;
    const toast: Toast = { id, type, title, message, duration };

    // Add to list
    this._toasts.update((list) => [...list, toast]);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  /**
   * Success toast — green
   */
  success(title: string, message?: string): void {
    this.show('success', title, message, 4000);
  }

  /**
   * Error toast — red (stays longer)
   */
  error(title: string, message?: string): void {
    this.show('error', title, message, 6000);
  }

  /**
   * Info toast — blue
   */
  info(title: string, message?: string): void {
    this.show('info', title, message, 4000);
  }

  /**
   * Warning toast — amber
   */
  warning(title: string, message?: string): void {
    this.show('warning', title, message, 5000);
  }

  /**
   * Remove a specific toast by id
   */
  remove(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  /**
   * Clear all toasts immediately
   */
  clear(): void {
    this._toasts.set([]);
  }
}
