import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable icon component supporting English SVG names (inspired by dazzle-icons / modern icon sets).
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  /** English icon name corresponding to SVG */
  @Input() name: string = 'Bank';

  /** Size in pixels or string (e.g., 24 or '24px') */
  @Input() size: number | string = 24;

  /** Color of the icon */
  @Input() color: string = 'currentColor';

  get formattedSize(): string {
    return typeof this.size === 'number' ? `${this.size}px` : this.size;
  }
}
