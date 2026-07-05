import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

/**
 * Unified entity card component for listing accounts, banks, credit cards, categories, and recurring rules.
 */
@Component({
  selector: 'app-entity-card',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './entity-card.component.html',
  styleUrls: ['./entity-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EntityCardComponent {
  @Input() icon?: string;
  @Input() title!: string;
  @Input() value?: string;
  @Input() editRoute?: string | any[];
  @Input() editText = 'Editar';
  @Input() editIcon?: string;
  @Input() actionRoute?: string | any[];
  @Input() actionText?: string;
  @Input() actionIcon?: string;
  @Input() showDelete = false;
  @Input() deleteText = 'Eliminar';
  @Input() showActions = true;

  @Output() actionClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
}
