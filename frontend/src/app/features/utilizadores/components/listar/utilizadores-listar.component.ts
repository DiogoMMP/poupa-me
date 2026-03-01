import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UtilizadoresListViewModel } from './utilizadores-listar.view-model';

@Component({
  selector: 'app-utilizadores-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './utilizadores-listar.component.html',
  styleUrls: ['./utilizadores-listar.component.css'],
  providers: [UtilizadoresListViewModel]
})
export class UtilizadoresListComponent implements OnInit {
  public vm = inject(UtilizadoresListViewModel);

  // Expose commonly used observables/actions directly to the template for easier bindings
  public isLoading$ = this.vm.isLoading$;
  public users$ = this.vm.users$;
  public auth = this.vm.auth;

  // helper that forwards to vm — accept undefined because template value may be optional
  deleteUser(email?: string): void { if (!email) return; this.vm.deleteUserByEmail(email); }
  toggleRole(email?: string, role?: string): void { if (!email || !role) return; this.vm.toggleRole(email, role); }

  ngOnInit() {
    this.vm.loadData();
  }
}
