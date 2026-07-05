import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable loading component featuring a dynamic 3D spinning coin animation.
 */
@Component({
  selector: 'app-loading-coin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-coin.component.html',
  styleUrls: ['./loading-coin.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingCoinComponent {
  @Input() message: string = 'A carregar...';
  @Input() size: 'medium' | 'large' = 'medium';
}
