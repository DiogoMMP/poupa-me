import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';

/**
 * Not Found component displaying the 404 page content.
 */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: 'not_found.component.html',
  styleUrls: ['not_found.component.css']
})

/**
 * Not Found component class.
 */
export class NotFoundComponent {}

/**
 * Routes for the not found feature module.
 */
export const routes: Routes = [
  { path: '', component: NotFoundComponent }
];
