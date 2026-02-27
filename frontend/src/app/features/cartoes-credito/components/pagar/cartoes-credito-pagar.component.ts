import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CartoesCreditoPagarViewModel } from './cartoes-credito-pagar.view-model';
import { CartoesCreditoModel } from '../../models/cartoes-credito.model';

/**
 * Component to edit an existing credit card. It loads the card data based on the ID from the route,
 * allows the user to change the card fields (except saldoUtilizado) and submit the changes.
 */
@Component({
  selector: 'app-cartao-credito-pagar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './cartoes-credito-pagar.component.html',
  styleUrls: ['./cartoes-credito-pagar.component.css'],
  providers: [CartoesCreditoPagarViewModel]
})
export class CartoesCreditoPagarComponent implements OnInit, OnDestroy {
  public vm: CartoesCreditoPagarViewModel = inject(CartoesCreditoPagarViewModel);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  id: string = '';

  constructor() {
    // Only periodo fields are required for pagar
    this.form = this.fb.group({
      periodo: this.fb.group({
        dataInicio: ['', Validators.required],
        dataFim: ['', Validators.required]
      })
    });
  }

  /**
   * On init, we get the card ID from the route parameters and load the card data. We also subscribe to the card data
   * observable to fill the form once the data is loaded.
   */
  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    if (this.id) {
      this.vm.loadData(this.id);

      // When the cartao loads, compute and set default periodo if form empty
      this.vm.cartao$.subscribe((cartao: CartoesCreditoModel | null) => {
        if (cartao) {
          // If form not yet set, compute defaults
          const currentPeriodo = (this.form.get('periodo') as FormGroup).value;
          // Only set defaults if empty
          if (!currentPeriodo.dataInicio && !currentPeriodo.dataFim) {
            const defaults = this.vm.computeDefaultPeriodoISO(cartao);
            if (defaults) {
              this.form.patchValue({ periodo: { dataInicio: defaults.dataInicioISO, dataFim: defaults.dataFimISO } });
            }
          }
        }
      });
    }
  }

  /**
   * On destroy, we make sure to clean up the emoji picker instance to avoid memory leaks.
   */
  ngOnDestroy() {
    // nothing special here
  }

  /**
   * Handles the form submission. We first check if the form is valid, and if it is, we call the submit method on the
   * view model, passing the account ID and the form values.
   * The view model will handle the actual update logic, including making the API call and handling success or error responses.
   * This separation of concerns allows us to keep the component focused on the UI logic, while the view model handles
   * the business logic and state management.
   */
  onSubmit() {
    if (!this.form.valid) return;

    // confirmation
    if (!confirm('Confirmar pagamento do período atual e configurar o próximo período?')) return;

    const periodoValue = (this.form.value as { periodo: { dataInicio: string; dataFim: string } }).periodo;
    this.vm.submitPagar(this.id, periodoValue);
  }
}
