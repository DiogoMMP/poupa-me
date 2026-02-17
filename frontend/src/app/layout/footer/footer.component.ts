import {Component, ChangeDetectionStrategy, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {NotificationService} from '../../services/notification.service';
/**
 * Footer component displaying application footer information.
 */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.css'],
  host: { class: 'layout-footer' }
})

/**
 * Footer component class.
 */
export class FooterComponent {
  readonly year = new Date().getFullYear();

  private auth = inject(AuthService);
  user = this.auth.user;

  private router = inject(Router);

  // Inject router to read current url for return navigation
  private currentRouter = inject(Router);

  // Notification service
  notif = inject(NotificationService);

  /**
   * Logs out the current user and navigates to the home page.
   */
  logout() {
    // call logout if available
    if (typeof this.auth.logout === 'function') {
      this.auth.logout();
    } else {
      // fallback: clear user signal
      this.user.set(null);
    }

    // show confirmation notification
    try {
      const msg = 'Até logo, ' + (this.user()?.name || 'usuário') + '!';
      this.notif.success(msg);
    } catch (e) {
      // fallback message
      this.notif.success('Logged out');
    }

    this.router.navigate(['/entrar']);
  }

  // Navigate to profile and include the current URL as returnUrl state so Profile can return
  goToProfile(ev: Event) {
    ev.preventDefault();
    const returnUrl = this.currentRouter.url || '/';
    this.router.navigate(['/profile'], { state: { returnUrl } });
  }
}
