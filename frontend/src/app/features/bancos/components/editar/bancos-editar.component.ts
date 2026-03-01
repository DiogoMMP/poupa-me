import { Component, OnInit, inject, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { createPicker } from 'picmo';
import { BancosEditarViewModel } from './bancos-editar.view-model';

/**
 * Component to edit an existing bank. It loads the bank data based on the ID from the route,
 * allows the user to change the name and icon, and submit the changes.
 */
@Component({
  selector: 'app-banco-editar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './bancos-editar.component.html',
  styleUrls: ['./bancos-editar.component.css'],
  providers: [BancosEditarViewModel]
})
export class BancosEditarComponent implements OnInit, OnDestroy {
  public vm = inject(BancosEditarViewModel);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('emojiPickerContainer') pickerContainer!: ElementRef<HTMLElement>;

  form: FormGroup;
  id: string = '';
  showEmojiPicker = false;
  private picker: any = null;

  constructor() {
    this.form = this.fb.group({
      nome: [''],
      icon: [''],
      contasCartoesSelecionados: [[]]
    });
  }

  /**
   * On init, we get the bank ID from the route parameters and load the bank data. We also subscribe to the bank data
   * observable to fill the form once the data is loaded.
   */
  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    if (this.id) {
      this.vm.loadData(this.id);

      // Fill form when data arrives
      this.vm.banco$.subscribe(banco => {
        if (banco) {
          this.form.patchValue({
            nome: banco.nome,
            icon: banco.icon,
            contasCartoesSelecionados: banco.contasCartoesSelecionados || []
          });
        }
      });

      // Populate selection lists
      this.vm.contas$.subscribe();
      this.vm.cartoes$.subscribe();
    }
  }

  /**
   * On destroy, we make sure to clean up the emoji picker instance to avoid memory leaks.
   */
  ngOnDestroy() {
    this.destroyPicker();
  }

  /**
   * Initializes the emoji picker. We check if the picker is not already initialized and if the container element is available.
   * We use a timeout to ensure that the DOM is ready before we try to create the picker. We also set up an event listener for when an emoji is selected.
   */
  initializePicker() {
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

  /**
   * Toggles the visibility of the emoji picker. If we show the picker, we initialize it. If we hide it, we destroy the
   * instance to free up resources.
   */
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (this.showEmojiPicker) {
      setTimeout(() => this.initializePicker(), 50);
    } else {
      this.destroyPicker();
    }
  }

  /**
   * Closes the emoji picker and destroys the instance to free up resources. We also trigger change detection to update the view.
   */
  closeEmojiPicker() {
    this.showEmojiPicker = false;
    this.destroyPicker();
    this.cdr.detectChanges();
  }

  /**
   * Destroys the emoji picker instance if it exists. This is important to avoid memory leaks and ensure that we don't
   * have multiple instances of the picker running at the same time.
   * We also set the picker variable to null to indicate that there is no active picker instance.
   */
  destroyPicker() {
    if (this.picker) {
      this.picker.destroy();
      this.picker = null;
    }
  }

  // Helpers to manage selection array in the form
  isSelected(id: string): boolean {
    const arr: string[] = this.form.get('contasCartoesSelecionados')?.value || [];
    return arr.includes(id);
  }

  toggleSelection(id: string): void {
    const control = this.form.get('contasCartoesSelecionados');
    const arr: string[] = control?.value || [];
    const idx = arr.indexOf(id);
    if (idx >= 0) {
      arr.splice(idx, 1);
    } else {
      arr.push(id);
    }
    control?.setValue([...arr]);
  }

  /**
   * Handles the form submission. We first check if the form is valid, and if it is, we call the submit method on the
   * view model, passing the bank ID and the form values.
   * The view model will handle the actual update logic, including making the API call and handling success or error responses.
   * This separation of concerns allows us to keep the component focused on the UI logic, while the view model handles
   * the business logic and state management.
   */
  onSubmit() {
    // patch will be partial; do not require fields for a PATCH
    const payload = this.form.value;
    this.vm.submit(this.id, payload);
  }
}
