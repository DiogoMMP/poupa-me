import { Component, inject, ViewChild, ElementRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { createPicker } from 'picmo';
import { DespesasRecorrentesEditarRegraViewModel } from './despesas-recorrentes-editar-regra.view-model';
import { UpdateDespesaRecorrenteDTO } from '../../dto/despesas-recorrentes.dto';

@Component({
  selector: 'app-despesas-recorrentes-editar-regra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './despesas-recorrentes-editar-regra.component.html',
  styleUrls: ['./despesas-recorrentes-editar-regra.component.css'],
  providers: [DespesasRecorrentesEditarRegraViewModel]
})
export class DespesasRecorrentesEditarRegraComponent implements OnInit, OnDestroy {
  public vm = inject(DespesasRecorrentesEditarRegraViewModel);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  @ViewChild('emojiPickerContainer') pickerContainer!: ElementRef<HTMLElement>;

  showEmojiPicker = false;
  private picker: any = null;
  private regraId: string | null = null;

  form: FormGroup = this.fb.group({
    nome:            ['', Validators.required],
    icon:            ['', Validators.required],
    tipo:            ['Despesa Mensal', Validators.required],
    categoriaId:     ['', Validators.required],
    contaOrigemId:   ['', Validators.required],
    contaDestinoId:  ['', Validators.required],
    contaPoupancaId: [null],
    valor: this.fb.group({
      valor: [null],
      moeda: ['EUR']
    }),
    diaDoMes: [null],
  });

  get isPoupanca(): boolean {
    return this.form.get('tipo')?.value === 'Poupança';
  }

  ngOnInit(): void {
    this.regraId = this.route.snapshot.paramMap.get('id');
    if (this.regraId) this.vm.load(this.regraId);

    this.vm.regra$.subscribe(regra => {
      if (!regra) return;
      this.form.patchValue({
        nome:            regra.nome,
        icon:            regra.icon,
        tipo:            regra.tipo,
        categoriaId:     regra.categoriaId,
        contaOrigemId:   regra.contaOrigemId,
        contaDestinoId:  regra.contaDestinoId,
        contaPoupancaId: regra.contaPoupancaId ?? null,
        valor: {
          valor: regra.valor?.valor ?? null,
          moeda: regra.valor?.moeda ?? 'EUR'
        },
        diaDoMes: regra.diaDoMes ?? null,
      });
    });
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
    if (this.form.invalid || !this.regraId) return;

    const raw = this.form.value;
    const valorNum = raw.valor?.valor;
    const valorPayload = (valorNum !== null && valorNum !== undefined && valorNum !== '')
      ? { valor: Number(valorNum), moeda: raw.valor.moeda || 'EUR' }
      : undefined;

    const payload: UpdateDespesaRecorrenteDTO = {
      nome:            raw.nome,
      icon:            raw.icon,
      tipo:            raw.tipo,
      categoriaId:     raw.categoriaId,
      contaOrigemId:   raw.contaOrigemId,
      contaDestinoId:  raw.contaDestinoId,
      contaPoupancaId: raw.contaPoupancaId || undefined,
      valor:           valorPayload,
      diaDoMes:        raw.diaDoMes ? Number(raw.diaDoMes) : undefined,
    };

    this.vm.update(this.regraId, payload);
  }
}
