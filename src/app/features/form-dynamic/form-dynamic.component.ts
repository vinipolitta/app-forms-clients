import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormTemplateService, FormTemplate, FormField } from '../../core/services/form-template.service';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-form-dynamic',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-dynamic.component.html',
  styleUrls: ['./form-dynamic.component.scss']
})
export class FormDynamicComponent implements OnInit {

  public template: FormTemplate | null = null;
  public loading = false;
  public form: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private service: FormTemplateService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      fields: this.fb.array([])
    });
  }

  get fields(): FormArray {
    return this.form.get('fields') as FormArray;
  }

  ngOnInit(): void {
    // Observe route params to handle slug changes dynamically
    this.route.params
      .pipe(
        switchMap(params => {
          const slug = params['slug'];
          if (!slug) return of(null);

          this.loading = true;
          this.template = null;  // Reset previous template
          this.fields.clear();   // Clear previous form
          this.cdr.detectChanges();

          return this.service.getTemplateBySlug(slug);
        })
      )
      .subscribe({
        next: (template: FormTemplate | null) => {
          if (template) {
            this.template = template;
            this.buildForm(template.fields);
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          console.error('Erro ao carregar o formulário');
          this.loading = false;
        }
      });
  }

  buildForm(fields: FormField[]) {
    this.fields.clear();
    fields.forEach(f => {
      this.fields.push(this.fb.group({
        label: [f.label],
        type: [f.type],
        value: ['', f.required ? Validators.required : []],
        required: [f.required ?? false]
      }));
    });
    this.cdr.detectChanges();
  }

  submit() {
    if (this.form.invalid) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    const payload = this.fields.controls.map(c => ({
      label: c.value.label,
      type: c.value.type,
      value: c.value.value
    }));

    console.log('Dados enviados:', payload);
    alert('Formulário enviado com sucesso! (apenas log no console)');
  }
}