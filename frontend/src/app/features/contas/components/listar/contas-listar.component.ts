import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContasListViewModel } from './contas-listar.view-model';

@Component({
  selector: 'app-contas-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contas-listar.component.html',
  styleUrls: ['./contas-listar.component.css'],
  providers: [ContasListViewModel]
})
export class ContasListComponent implements OnInit {
  public vm: ContasListViewModel = inject(ContasListViewModel);

  // expose common observables and helpers for template consumption
  public isLoading$ = this.vm.isLoading$;
  public contas$ = this.vm.contas$;
  public auth = this.vm.auth;

  // expose selected banco ID so template can check if banco is selected
  get hasBancoSelected(): boolean {
    return this.vm.hasBancoSelected;
  }

  ngOnInit() {
    // ViewModel subscribes to SelectedBancoService and will load when banco changes
    // Call loadData once to ensure initial load if needed (BehaviorSubject emits current value)
    this.vm.loadData();
  }

  deleteConta(id: string) {
    this.vm.deleteConta(id);
  }
}
