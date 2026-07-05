import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DespesaRecorrenteModel } from '../../../features/despesas-recorrentes/models/despesas-recorrentes.model';

@Component({
  selector: 'app-sem-valor-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sem-valor-section.component.html',
  styleUrls: ['./sem-valor-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SemValorSectionComponent {
  @Input({ required: true }) label = '';
  @Input() items: DespesaRecorrenteModel[] | null = null;

  @Output() itemClicked = new EventEmitter<DespesaRecorrenteModel>();

  onClick(item: DespesaRecorrenteModel): void {
    this.itemClicked.emit(item);
  }
}
