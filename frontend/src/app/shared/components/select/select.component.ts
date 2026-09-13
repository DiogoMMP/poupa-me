import {
  Component, Input, ChangeDetectionStrategy, forwardRef, signal, computed, inject,
  ElementRef, ViewChild, ViewChildren, QueryList, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { SelectRegistryService } from './select-registry.service';

/**
 * Uma opção do `<app-select>`.
 */
export interface AppSelectOption {
  value: any;
  label: string;
}

/**
 * Dropdown customizado reutilizável, substituto de `<select>` nativo, compatível com Reactive Forms
 * (`formControlName`) e template-driven forms (`[(ngModel)]`) via `ControlValueAccessor`.
 *
 * @example
 * ```html
 * <app-select [options]="categoriaOptions" formControlName="categoriaId" placeholder="Selecione uma categoria"></app-select>
 * ```
 */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectComponent),
    multi: true
  }]
})
export class SelectComponent implements ControlValueAccessor {
  private readonly registry = inject(SelectRegistryService);
  private readonly optionsSignal = signal<AppSelectOption[]>([]);

  /**
   * Lista de opções disponíveis. Guardada num signal internamente para que `selectedOption`
   * recalcule corretamente quando as opções chegam de forma assíncrona (ex.: `| async`) depois do
   * valor já ter sido definido pelo formulário.
   */
  @Input()
  set options(value: AppSelectOption[]) {
    this.optionsSignal.set(value ?? []);
  }
  get options(): AppSelectOption[] {
    return this.optionsSignal();
  }

  /**
   * Texto mostrado no gatilho quando não há nenhum valor selecionado.
   */
  @Input() placeholder = 'Selecionar';

  @ViewChild('trigger') private triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChildren('optionEl') private optionEls?: QueryList<ElementRef<HTMLLIElement>>;

  readonly value = signal<any>(null);
  readonly disabled = signal(false);
  readonly showMenu = signal(false);
  readonly activeIndex = signal(-1);

  /**
   * Opção correspondente ao valor atual, ou `null` se nenhuma corresponder (mostra o placeholder).
   */
  readonly selectedOption = computed<AppSelectOption | null>(() => {
    const v = this.value();
    return this.optionsSignal().find(o => o.value === v) ?? null;
  });

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  // --- ControlValueAccessor ---

  writeValue(value: any): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // --- Interação ---

  /**
   * Abre o dropdown, avisando o `SelectRegistryService` para fechar qualquer outro `app-select` que
   * estivesse aberto na página.
   */
  private open(): void {
    this.showMenu.set(true);
    this.activeIndex.set(this.options.findIndex(o => o.value === this.value()));
    this.registry.register(this);
  }

  /**
   * Fecha o dropdown e desregista-se do `SelectRegistryService`. Público para que o registo possa
   * chamá-lo diretamente noutra instância.
   */
  close(): void {
    this.showMenu.set(false);
    this.registry.unregister(this);
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled() || this.options.length === 0) return;
    this.onTouched();
    if (this.showMenu()) {
      this.close();
    } else {
      this.open();
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.close();
  }

  selectOption(event: MouseEvent, option: AppSelectOption): void {
    event.stopPropagation();
    this.value.set(option.value);
    this.onChange(option.value);
    this.close();
    this.triggerRef?.nativeElement.focus();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') return;
    if (this.disabled() || this.options.length === 0) return;

    event.preventDefault();
    if (!this.showMenu()) {
      this.open();
    }
    this.focusActiveOption();
  }

  onListKeydown(event: KeyboardEvent, option: AppSelectOption): void {
    const total = this.options.length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set((this.activeIndex() + 1) % total);
        this.focusActiveOption();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set((this.activeIndex() - 1 + total) % total);
        this.focusActiveOption();
        break;
      case 'Enter':
        event.preventDefault();
        this.value.set(option.value);
        this.onChange(option.value);
        this.close();
        this.triggerRef?.nativeElement.focus();
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        this.triggerRef?.nativeElement.focus();
        break;
    }
  }

  private focusActiveOption(): void {
    setTimeout(() => {
      const el = this.optionEls?.get(this.activeIndex())?.nativeElement;
      el?.focus();
    });
  }
}
