import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContasListViewModel } from './contas-listar.view-model';
import { formatEntityReference as formatEntityReferenceUtil } from '../../../../shared/utils/entity-reference.util';


import { IconComponent } from '../../../../shared/components/icon/icon.component';
@Component({
  selector: 'app-contas-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent],
  templateUrl: './contas-listar.component.html',
  styleUrls: ['./contas-listar.component.css'],
  providers: [ContasListViewModel]
})
export class ContasListComponent {
  public vm: ContasListViewModel = inject(ContasListViewModel);

  // expose common observables and helpers for template consumption
  public isLoading$ = this.vm.isLoading$;
  public contas$ = this.vm.contas$;
  public auth = this.vm.auth;
  public formatEntityReference = formatEntityReferenceUtil;

  // expose selected banco ID so template can check if banco is selected
  get hasBancoSelected(): boolean {
    return this.vm.hasBancoSelected;
  }

  // The ViewModel loads the contas itself: its constructor subscribes to SelectedBancoService, whose
  // BehaviorSubject emits the current banco right away. Calling loadData() here without a banco would cancel
  // that in-flight request (see 664e17d) and clear the list.

  deleteConta(id: string) {
    this.vm.deleteConta(id);
  }
}
