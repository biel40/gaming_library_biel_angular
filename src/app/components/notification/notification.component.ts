import { Component, OnInit, OnDestroy, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification/notification.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  animations: [
    trigger('notificationAnimation', [
      state('visible', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition(':enter', [
        style({
          transform: 'translateX(100%)',
          opacity: 0
        }),
        animate('300ms ease-out')
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({
          transform: 'translateX(100%)',
          opacity: 0
        }))
      ])
    ])
  ]
})
export class NotificationComponent implements OnInit, OnDestroy {
  activeNotifications = signal<Notification[]>([]);
  private subscription: Subscription = new Subscription();
  
  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      // Just reading the signal value will make this effect re-run when it changes
      const notifications = this.activeNotifications();
      // Only trigger change detection if we have notifications
      if (notifications.length > 0) {
        this.cdr.detectChanges();
      }
    });
  }
  
  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(notification => {
      this.addNotification(notification);
    });
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  addNotification(notification: Notification): void {
    // Update the signal with a new array (immutable update pattern)
    this.activeNotifications.update(notifications => [...notifications, notification]);
    
    if (notification.duration) {
      const removeAfterDuration = () => {
        const startTime = performance.now();
        
        const checkTime = () => {
          const currentTime = performance.now();
          const elapsed = currentTime - startTime;
          
          if (elapsed >= notification.duration!) {
            this.removeNotification(notification);
          } else {
            requestAnimationFrame(checkTime);
          }
        };
        
        requestAnimationFrame(checkTime);
      };
      
      removeAfterDuration();
    }
  }
  
  removeNotification(notificationToRemove: Notification): void {
    // Update the signal with a new filtered array (immutable update pattern)
    this.activeNotifications.update(notifications => 
      notifications.filter(notification => notification !== notificationToRemove)
    );
  }
  
  getIconForType(type: string): string {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'notifications';
    }
  }
}
