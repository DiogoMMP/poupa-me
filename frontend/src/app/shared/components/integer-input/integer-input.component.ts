import { Component, Input, ChangeDetectionStrategy, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Input numérico inteiro reutilizável, substituto de `<input type="number">` para campos não
 * monetários (ex.: dia do mês, mês). Ao contrário do `app-money-input`, não mostra nenhum símbolo —
 * só remove as setas nativas do browser e alinha o estilo ao resto dos inputs da app.
 *
 * @example
 * ```html
 * <app-integer-input formControlName="diaDoMes" [min]="1" [max]="31" placeholder="Ex: 15"></app-integer-input>
 * ```
 */
@Component({
  selector: 'app-integer-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './integer-input.component.html',
  styleUrls: ['./integer-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => IntegerInputComponent),
    multi: true
  }]
})
export class IntegerInputComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() min: number | null = null;
  @Input() max: number | null = null;

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
