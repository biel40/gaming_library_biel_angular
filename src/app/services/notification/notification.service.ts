import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  notifications$ = this.notificationSubject.asObservable();

  constructor() { }

  /**
   * Show a success notification
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 3000)
   */
  success(message: string, duration: number = 3000): void {
    this.notificationSubject.next({
      message,
      type: 'success',
      duration
    });
  }

  /**
   * Show an error notification
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 5000)
   */
  error(message: string, duration: number = 5000): void {
    this.notificationSubject.next({
      message,
      type: 'error',
      duration
    });
  }

  /**
   * Show an info notification
   * @param message The message to display
   * @param duration Duration in milliseconds (default: 3000)
   */
  info(message: string, duration: number = 3000): void {
    this.notificationSubject.next({
      message,
      type: 'info',
      duration
    });
  }
}
