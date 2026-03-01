import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DespesasRecorrentesListarRegrasViewModel } from './despesas-recorrentes-listar-regras.view-model';

@Component({
  selector: 'app-despesas-recorrentes-listar-regras',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './despesas-recorrentes-listar-regras.component.html',
  styleUrls: ['./despesas-recorrentes-listar-regras.component.css'],
  providers: [DespesasRecorrentesListarRegrasViewModel]
})
export class DespesasRecorrentesListarRegrasComponent implements OnInit {
  public vm = inject(DespesasRecorrentesListarRegrasViewModel);

  ngOnInit(): void {
    this.vm.loadData();
  }

  deleteRegra(id: string): void {
    this.vm.deleteRegra(id);
  }
}
