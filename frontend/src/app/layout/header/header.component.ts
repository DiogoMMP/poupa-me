import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

/**
 * Header component displaying the application header with user info and logout functionality.
 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css'],
  host: { class: 'layout-header' }
})

/**
 * Header component class.
 */
export class HeaderComponent {
}
