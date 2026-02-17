import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';

/**
 * Not Authorized component displaying the 403 page content.
 */
@Component({
  selector: 'app-not-authorized',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: 'not_authorized.component.html',
  styleUrls: ['not_authorized.component.css']
})

/**
 * Not Authorized component class.
 */
export class NotAuthorizedComponent {}

/**
 * Routes for the not found feature module.
 */
export const routes: Routes = [
  { path: '', component: NotAuthorizedComponent }
];
