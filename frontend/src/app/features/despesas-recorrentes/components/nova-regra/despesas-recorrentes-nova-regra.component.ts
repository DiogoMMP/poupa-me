import { Component, inject, ViewChild, ElementRef, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { createPicker } from 'picmo';
import { Subscription } from 'rxjs';
import { DespesasRecorrentesNovaRegraViewModel } from './despesas-recorrentes-nova-regra.view-model';
import { CreateDespesaRecorrenteDTO, TipoDespesaRecorrente } from '../../dto/despesas-recorrentes.dto';

@Component({
  selector: 'app-despesas-recorrentes-nova-regra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './despesas-recorrentes-nova-regra.component.html',
  styleUrls: ['./despesas-recorrentes-nova-regra.component.css'],
  providers: [DespesasRecorrentesNovaRegraViewModel]
})
export class DespesasRecorrentesNovaRegraComponent implements OnInit, OnDestroy {
  public vm = inject(DespesasRecorrentesNovaRegraViewModel);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private formSubscriptions = new Subscription();

  @ViewChild('emojiPickerContainer') pickerContainer!: ElementRef<HTMLElement>;

  showEmojiPicker = false;
  private picker: any = null;

  form: FormGroup = this.fb.group({
    nome:             ['', Validators.required],
    icon:             ['', Validators.required],
    tipo:             ['Despesa Mensal', Validators.required],
    categoriaId:      [null, Validators.required],
    contaOrigemId:    [null, Validators.required],
    contaDestinoId:   [null, Validators.required],
    contaPoupancaId:  [null],
    imediata:         [false],
    // opcionais
    valor: this.fb.group({
      valor: [null],
      moeda: ['EUR']
    }),
    diaDaSemana: [null],
    diaDoMes: [null],
    mes: [null],
  });

  get isImediata(): boolean {
    return !!this.form.get('imediata')?.value;
  }

  get isPoupanca(): boolean {
    return this.form.get('tipo')?.value === 'Poupança';
  }

  get isDespesaSemanal(): boolean {
    return this.form.get('tipo')?.value === 'Despesa Semanal';
  }

  get isDespesaMensal(): boolean {
    return this.form.get('tipo')?.value === 'Despesa Mensal';
  }

  get isDespesaAnual(): boolean {
    return this.form.get('tipo')?.value === 'Despesa Anual';
  }

  ngOnInit(): void {
    const imediataControl = this.form.get('imediata');
    const tipoControl = this.form.get('tipo');

    if (imediataControl) {
      this.formSubscriptions.add(
        imediataControl.valueChanges.subscribe((value) => this.updateContaDestinoValidator(!!value))
      );
      this.updateContaDestinoValidator(!!imediataControl.value);
    }

    if (tipoControl) {
      this.formSubscriptions.add(
        tipoControl.valueChanges.subscribe((value) => this.syncScheduledFields(value as TipoDespesaRecorrente))
      );
      this.syncScheduledFields(tipoControl.value as TipoDespesaRecorrente);
    }
  }

  ngOnDestroy(): void {
    this.formSubscriptions.unsubscribe();
    this.destroyPicker();
  }

  private updateContaDestinoValidator(imediata: boolean): void {
    const contaDestinoControl = this.form.get('contaDestinoId');
    if (!contaDestinoControl) return;

    if (imediata) {
      contaDestinoControl.clearValidators();
    } else {
      contaDestinoControl.setValidators([Validators.required]);
      contaDestinoControl.setValue(null, { emitEvent: false });
    }

    contaDestinoControl.setValue(null, { emitEvent: false });
    contaDestinoControl.updateValueAndValidity({ emitEvent: false });
  }

  private syncScheduledFields(tipo: TipoDespesaRecorrente): void {
    const diaDaSemanaControl = this.form.get('diaDaSemana');
    const diaDoMesControl = this.form.get('diaDoMes');
    const mesControl = this.form.get('mes');

    if (tipo === 'Despesa Semanal') {
      diaDaSemanaControl?.setValue(null, { emitEvent: false });
      diaDoMesControl?.setValue(null, { emitEvent: false });
      mesControl?.setValue(null, { emitEvent: false });
      return;
    }

    if (tipo === 'Despesa Mensal' || tipo === 'Poupança') {
      diaDaSemanaControl?.setValue(null, { emitEvent: false });
      diaDoMesControl?.setValue(null, { emitEvent: false });
      mesControl?.setValue(null, { emitEvent: false });
      return;
    }

    if (tipo === 'Despesa Anual') {
      diaDaSemanaControl?.setValue(null, { emitEvent: false });
      diaDoMesControl?.setValue(null, { emitEvent: false });
      mesControl?.setValue(null, { emitEvent: false });
    }
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
    const tipo = raw.tipo as TipoDespesaRecorrente;

    // Build optional valor — only include if a value was entered
    const valorNum = raw.valor?.valor;
    const valorPayload = (valorNum !== null && valorNum !== undefined && valorNum !== '')
      ? { valor: Number(valorNum), moeda: raw.valor.moeda || 'EUR' }
      : undefined;

    const payload: CreateDespesaRecorrenteDTO = {
      nome:             raw.nome,
      icon:             raw.icon,
      tipo,
      categoriaId:      raw.categoriaId,
      contaOrigemId:    raw.contaOrigemId,
      contaDestinoId:   raw.imediata ? undefined : raw.contaDestinoId || undefined,
      contaPoupancaId:  raw.contaPoupancaId || undefined,
      imediata:         raw.imediata,
      valor:            valorPayload,
      diaDaSemana:      tipo === 'Despesa Semanal' ? (raw.diaDaSemana ? Number(raw.diaDaSemana) : undefined) : undefined,
      diaDoMes:         (tipo === 'Despesa Mensal' || tipo === 'Despesa Anual' || tipo === 'Poupança') ? (raw.diaDoMes ? Number(raw.diaDoMes) : undefined) : undefined,
      mes:              tipo === 'Despesa Anual' ? (raw.mes ? Number(raw.mes) : undefined) : undefined,
    };

    this.vm.submit(payload);
  }
}
