import {
  Component, Input, ChangeDetectionStrategy, forwardRef, signal, computed, inject,
  ElementRef, ViewChild, ViewChildren, QueryList, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { SelectRegistryService } from '../select/select-registry.service';

interface DayCell {
  iso: string;
  day: number;
  inMonth: boolean;
  disabled: boolean;
}

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function toIso(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseIso(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  return { year: +match[1], month: +match[2] - 1, day: +match[3] };
}

/**
 * Calendário customizado reutilizável, substituto de `<input type="date">` nativo, compatível com
 * Reactive Forms (`formControlName`) e template-driven forms (`[(ngModel)]`) via `ControlValueAccessor`.
 * Valor sempre em string ISO `yyyy-MM-dd`, o mesmo formato que `<input type="date">` já produzia.
 *
 * @example
 * ```html
 * <app-date-picker formControlName="data" placeholder="Selecione uma data"></app-date-picker>
 * ```
 */
@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DatePickerComponent),
    multi: true
  }]
})
export class DatePickerComponent implements ControlValueAccessor {
  private readonly registry = inject(SelectRegistryService);

  @Input() placeholder = 'Selecionar data';
  /** ISO string (yyyy-MM-dd). Quando definida, datas depois desta ficam desativadas no calendário. */
  @Input() maxDate: string | null = null;

  @ViewChild('trigger') private triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChildren('dayEl') private dayEls?: QueryList<ElementRef<HTMLButtonElement>>;

  readonly weekdayLabels = WEEKDAY_LABELS;
  readonly value = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly showMenu = signal(false);
  readonly activeIso = signal<string | null>(null);

  private readonly viewYear = signal(new Date().getFullYear());
  private readonly viewMonth = signal(new Date().getMonth());

  readonly todayIso = toIso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  readonly monthLabel = computed(() => `${MONTH_LABELS[this.viewMonth()]} ${this.viewYear()}`);

  /**
   * Grelha de 42 células (6 semanas), semana a começar à segunda-feira, incluindo dias dos meses
   * adjacentes (visualmente esbatidos) para preencher a primeira/última semana.
   */
  readonly days = computed<DayCell[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const firstOfMonth = new Date(year, month, 1);
    const isoWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = segunda
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: DayCell[] = [];
    const isDisabled = (iso: string) => this.maxDate != null && iso > this.maxDate;

    for (let i = isoWeekday - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const d = new Date(year, month - 1, day);
      const iso = toIso(d.getFullYear(), d.getMonth(), day);
      cells.push({ iso, day, inMonth: false, disabled: isDisabled(iso) });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIso(year, month, day);
      cells.push({ iso, day, inMonth: true, disabled: isDisabled(iso) });
    }
    while (cells.length < 42) {
      const day = cells.length - (isoWeekday + daysInMonth) + 1;
      const d = new Date(year, month + 1, day);
      const iso = toIso(d.getFullYear(), d.getMonth(), day);
      cells.push({ iso, day, inMonth: false, disabled: isDisabled(iso) });
    }

    return cells;
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  // --- ControlValueAccessor ---

  writeValue(value: string | null): void {
    this.value.set(value || null);
    const parsed = value ? parseIso(value) : null;
    if (parsed) {
      this.viewYear.set(parsed.year);
      this.viewMonth.set(parsed.month);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // --- Formatação ---

  formatDisplay(iso: string): string {
    const parsed = parseIso(iso);
    if (!parsed) return iso;
    return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month + 1).padStart(2, '0')}/${parsed.year}`;
  }

  // --- Interação ---

  private open(): void {
    this.showMenu.set(true);
    const current = this.value() ?? this.todayIso;
    const parsed = parseIso(current)!;
    this.viewYear.set(parsed.year);
    this.viewMonth.set(parsed.month);
    this.activeIso.set(current);
    this.registry.register(this);
  }

  close(): void {
    this.showMenu.set(false);
    this.registry.unregister(this);
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
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

  selectDay(event: MouseEvent, cell: DayCell): void {
    event.stopPropagation();
    if (cell.disabled) return;
    this.value.set(cell.iso);
    this.onChange(cell.iso);
    if (!cell.inMonth) {
      const parsed = parseIso(cell.iso)!;
      this.viewYear.set(parsed.year);
      this.viewMonth.set(parsed.month);
    }
    this.close();
    this.triggerRef?.nativeElement.focus();
  }

  prevMonth(event: MouseEvent): void {
    event.stopPropagation();
    this.shiftMonth(-1);
  }

  nextMonth(event: MouseEvent): void {
    event.stopPropagation();
    this.shiftMonth(1);
  }

  private shiftMonth(delta: number): void {
    let month = this.viewMonth() + delta;
    let year = this.viewYear();
    if (month < 0) { month = 11; year -= 1; }
    if (month > 11) { month = 0; year += 1; }
    this.viewYear.set(year);
    this.viewMonth.set(month);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') return;
    if (this.disabled()) return;

    event.preventDefault();
    if (!this.showMenu()) {
      this.onTouched();
      this.open();
      this.focusActiveDay();
    }
  }

  onPanelKeydown(event: KeyboardEvent): void {
    const active = this.activeIso() ?? this.value() ?? this.todayIso;
    const parsed = parseIso(active)!;
    const current = new Date(parsed.year, parsed.month, parsed.day);

    switch (event.key) {
      case 'ArrowRight': event.preventDefault(); current.setDate(current.getDate() + 1); break;
      case 'ArrowLeft': event.preventDefault(); current.setDate(current.getDate() - 1); break;
      case 'ArrowDown': event.preventDefault(); current.setDate(current.getDate() + 7); break;
      case 'ArrowUp': event.preventDefault(); current.setDate(current.getDate() - 7); break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.maxDate != null && active > this.maxDate) return;
        this.value.set(active);
        this.onChange(active);
        this.close();
        this.triggerRef?.nativeElement.focus();
        return;
      case 'Escape':
        event.preventDefault();
        this.close();
        this.triggerRef?.nativeElement.focus();
        return;
      default:
        return;
    }

    const newIso = toIso(current.getFullYear(), current.getMonth(), current.getDate());
    this.activeIso.set(newIso);
    if (current.getFullYear() !== this.viewYear() || current.getMonth() !== this.viewMonth()) {
      this.viewYear.set(current.getFullYear());
      this.viewMonth.set(current.getMonth());
    }
    this.focusActiveDay();
  }

  private focusActiveDay(): void {
    setTimeout(() => {
      const active = this.activeIso();
      const index = this.days().findIndex(c => c.iso === active);
      const el = index >= 0 ? this.dayEls?.get(index)?.nativeElement : undefined;
      el?.focus();
    });
  }
}
