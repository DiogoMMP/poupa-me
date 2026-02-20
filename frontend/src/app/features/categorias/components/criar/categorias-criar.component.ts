import { Component, inject, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { createPicker } from 'picmo';
import { CategoriasCriarViewModel } from './categorias-criar.view-model';

/**
 * Component to create a new category.
 * Provides a form where the user can enter the category name and choose an icon (emoji),
 * then submit to create a new category record.
 */
@Component({
  selector: 'app-categorias-criar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './categorias-criar.component.html',
  styleUrls: ['./categorias-criar.component.css'],
  providers: [CategoriasCriarViewModel]
})
export class CategoriasCriarComponent implements OnDestroy {
  public vm = inject(CategoriasCriarViewModel);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('emojiPickerContainer') pickerContainer!: ElementRef<HTMLElement>;

  form: FormGroup;
  showEmojiPicker = false;
  private picker: any = null;

  constructor() {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      icon: ['', Validators.required]
    });
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

  /**
   * Handles the form submission for creating a new category.
   * Validates the form and forwards the values to the ViewModel which performs the API call
   * and manages notifications/loading state.
   */
  onSubmit() {
    if (this.form.valid) {
      this.vm.submit(this.form.value);
    }
  }
}
