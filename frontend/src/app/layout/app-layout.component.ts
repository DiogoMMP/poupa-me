import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { NotificationsComponent } from './notification/notifications.component';

/**
 * Main application layout component.
 * Defines the overall structure with header, navigation, footer, and router outlet for content.
 */
@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, HeaderComponent, NavComponent, FooterComponent, RouterOutlet, NotificationsComponent],
  templateUrl: "app-layout.component.html",
  styleUrl: "app-layout.component.css",
  host: { class: 'app-layout' }
})

/**
 * App layout component class.
 */
export class AppLayoutComponent {
  sidebarOpen = signal(false);

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar()  { this.sidebarOpen.set(false); }
}
