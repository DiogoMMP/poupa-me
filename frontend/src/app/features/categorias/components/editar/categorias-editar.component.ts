import { Component, OnInit, inject, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { createPicker } from 'picmo';
import { CategoriasEditarViewModel } from './categorias-editar.view-model';

/**
 * Component to edit an existing category. It loads the category by ID from the route,
 * allows the user to change the category name and icon, and submit the changes.
 */
@Component({
  selector: 'app-categoria-editar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './categorias-editar.component.html',
  styleUrls: ['./categorias-editar.component.css'],
  providers: [CategoriasEditarViewModel]
})
export class CategoriasEditarComponent implements OnInit, OnDestroy {
  public vm = inject(CategoriasEditarViewModel);
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
      icon: ['']
    });
  }

  /**
   * On init, we get the category ID from the route parameters and load the category data.
   * We also subscribe to the category observable to fill the form once the data is loaded.
   */
  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    if (this.id) {
      this.vm.loadData(this.id);

      // Fill form when data arrives
      this.vm.categoria$.subscribe(cat => {
        if (cat) {
          this.form.patchValue({
            nome: cat.nome,
            icon: cat.icon
          });
        }
      });
    }
  }

  /**
   * On destroy, clean up the emoji picker instance to avoid memory leaks.
   */
  ngOnDestroy() {
    this.destroyPicker();
  }

  /**
   * Initializes the emoji picker. Ensures the picker is created only once and hooks the emoji:select event
   * to patch the form with the selected emoji.
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

  /**
   * Handles the form submission. We first check if the form is valid, and if it is, we call the submit method on the
   * view model, passing the bank ID and the form values.
   * The view model will handle the actual update logic, including making the API call and handling success or error responses.
   * This separation of concerns allows us to keep the component focused on the UI logic, while the view model handles
   * the business logic and state management.
   */
  onSubmit() {
    const payload = this.form.value;
    // send as PUT using input DTO semantics (merge happens in view-model)
    this.vm.submit(this.id, payload);
  }
}
