import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BancosListViewModel } from './bancos-listar.view-model';


import { IconComponent } from '../../../../shared/components/icon/icon.component';
@Component({
  selector: 'app-bancos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent],
  templateUrl: './bancos-listar.component.html',
  styleUrls: ['./bancos-listar.component.css'],
  providers: [BancosListViewModel]
})
export class BancosListComponent implements OnInit {
  public vm = inject(BancosListViewModel);

  ngOnInit() {
    this.vm.loadData();
  }
}
