import { Component, Input, ChangeDetectionStrategy, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Input monetário reutilizável, substituto de `<input type="number">` para o campo `valor` das
 * transações/contas/cartões. Mostra o símbolo "€" embutido e é sempre EUR (a app não suporta outra
 * moeda) — o consumidor mantém o `FormControl` `moeda` no `FormGroup` com o valor fixo `'EUR'`, só
 * deixa de o mostrar num input próprio.
 *
 * @example
 * ```html
 * <app-money-input formControlName="valor" placeholder="Ex: 45.50"></app-money-input>
 * ```
 */
@Component({
  selector: 'app-money-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './money-input.component.html',
  styleUrls: ['./money-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MoneyInputComponent),
    multi: true
  }]
})
export class MoneyInputComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() min: number | null = 0;
  @Input() step: number | string = '0.01';

  readonly value = signal<number | null>(null);
  readonly disabled = signal(false);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(raw: string): void {
    const parsed = raw === '' ? null : Number(raw);
    this.value.set(parsed);
    this.onChange(parsed);
  }

  onBlur(): void {
    this.onTouched();
  }
}
