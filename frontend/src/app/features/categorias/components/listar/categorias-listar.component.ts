import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoriasListViewModel } from './categorias-listar.view-model';

@Component({
  selector: 'app-categorias-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './categorias-listar.component.html',
  styleUrls: ['./categorias-listar.component.css'],
  providers: [CategoriasListViewModel]
})
export class CategoriasListComponent implements OnInit {
  public vm = inject(CategoriasListViewModel);

  // Expose commonly used observables/actions directly to the template for easier bindings
  public isLoading$ = this.vm.isLoading$;
  public categorias$ = this.vm.categorias$;
  public auth = this.vm.auth;

  // helper that forwards to vm
  deleteCategoria(id: string) { this.vm.deleteCategoria(id); }

  ngOnInit() {
    this.vm.loadData();
  }
}
