import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartoesCreditoListViewModel } from './cartoes-credito-listar.view-model';

@Component({
  selector: 'app-cartao-credito-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cartoes-credito-listar.component.html',
  styleUrls: ['./cartoes-credito-listar.component.css'],
  providers: [CartoesCreditoListViewModel]
})
export class CartoesCreditoListComponent implements OnInit {
  public vm: CartoesCreditoListViewModel = inject(CartoesCreditoListViewModel);

  // expose common observables and helpers for template consumption
  public isLoading$ = this.vm.isLoading$;
  public cartoes$ = this.vm.cartoes$;
  public auth = this.vm.auth;

  // expose selected banco ID so template can check if banco is selected
  get hasBancoSelected(): boolean {
    return this.vm.hasBancoSelected;
  }

  ngOnInit() {
    // ViewModel subscribes to SelectedBancoService and will load when banco changes
    // Call loadCartoes once to ensure initial load if needed (BehaviorSubject emits current value)
    this.vm.loadCartoes();
  }
}
