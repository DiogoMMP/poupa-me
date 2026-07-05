import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransacaoModel } from '../../../features/transacoes/models/transacoes.model';
import { formatData } from '../../utils/date-formatter.util';

@Component({
  selector: 'app-transacao-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './transacao-item.component.html',
  styleUrls: ['./transacao-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TransacaoItemComponent {
  @Input({ required: true }) transacao!: TransacaoModel;
  @Input() showActions = true;
  @Input() showStatus = true;
  @Input() showConcluir = false;
  @Input() isBusy = false;
  @Input() editRoutePrefix = '/transacoes/editar';
  @Input() iconOverride?: 'concluido';

  @Output() deleted = new EventEmitter<TransacaoModel>();
  @Output() concluido = new EventEmitter<TransacaoModel>();

  readonly formatData = formatData;

  get isPositive(): boolean {
    const t = this.transacao.tipo;
    return t === 'Entrada' || t === 'Reembolso';
  }

  get iconClass(): string {
    if (this.iconOverride === 'concluido') return 'concluido-icon';
    return this.isPositive ? 'entradas-icon' : 'saidas-icon';
  }

  onDelete(): void {
    this.deleted.emit(this.transacao);
  }

  onConcluir(): void {
    this.concluido.emit(this.transacao);
  }
}
