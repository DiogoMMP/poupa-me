import { Component, inject, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { createPicker } from 'picmo';
import { DespesasRecorrentesNovaRegraViewModel } from './despesas-recorrentes-nova-regra.view-model';
import { CreateDespesaRecorrenteDTO } from '../../dto/despesas-recorrentes.dto';

@Component({
  selector: 'app-despesas-recorrentes-nova-regra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './despesas-recorrentes-nova-regra.component.html',
  styleUrls: ['./despesas-recorrentes-nova-regra.component.css'],
  providers: [DespesasRecorrentesNovaRegraViewModel]
})
export class DespesasRecorrentesNovaRegraComponent implements OnDestroy {
  public vm = inject(DespesasRecorrentesNovaRegraViewModel);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('emojiPickerContainer') pickerContainer!: ElementRef<HTMLElement>;

  showEmojiPicker = false;
  private picker: any = null;

  form: FormGroup = this.fb.group({
    nome:             ['', Validators.required],
    icon:             ['', Validators.required],
    tipo:             ['Despesa Mensal', Validators.required],
    categoriaId:      ['', Validators.required],
    contaOrigemId:    ['', Validators.required],
    contaDestinoId:   ['', Validators.required],
    contaPoupancaId:  [null],
    // opcionais
    valor: this.fb.group({
      valor: [null],
      moeda: ['EUR']
    }),
    diaDoMes: [null],
  });

  get isPoupanca(): boolean {
    return this.form.get('tipo')?.value === 'Poupança';
  }

  ngOnDestroy(): void {
    this.destroyPicker();
  }

  initializePicker(): void {
    if (!this.picker && this.pickerContainer) {
      setTimeout(() => {
        this.picker = createPicker({
          rootElement: this.pickerContainer.nativeElement,
          theme: 'dark',
          showPreview: false,
          showRecents: true,
          emojiSize: '1.5rem',
          emojisPerRow: 9,
          visibleRows: 8,
        });
        this.picker.addEventListener('emoji:select', (event: any) => {
          this.form.patchValue({ icon: event.emoji });
          this.closeEmojiPicker();
        });
      }, 0);
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (this.showEmojiPicker) {
      setTimeout(() => this.initializePicker(), 50);
    } else {
      this.destroyPicker();
    }
  }

  closeEmojiPicker(): void {
    this.showEmojiPicker = false;
    this.destroyPicker();
    this.cdr.detectChanges();
  }

  destroyPicker(): void {
    if (this.picker) {
      this.picker.destroy();
      this.picker = null;
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const raw = this.form.value;

    // Build optional valor — only include if a value was entered
    const valorNum = raw.valor?.valor;
    const valorPayload = (valorNum !== null && valorNum !== undefined && valorNum !== '')
      ? { valor: Number(valorNum), moeda: raw.valor.moeda || 'EUR' }
      : undefined;

    const payload: CreateDespesaRecorrenteDTO = {
      nome:             raw.nome,
      icon:             raw.icon,
      tipo:             raw.tipo,
      categoriaId:      raw.categoriaId,
      contaOrigemId:    raw.contaOrigemId,
      contaDestinoId:   raw.contaDestinoId,
      contaPoupancaId:  raw.contaPoupancaId || undefined,
      valor:            valorPayload,
      diaDoMes:         raw.diaDoMes ? Number(raw.diaDoMes) : undefined,
    };

    this.vm.submit(payload);
  }
}
