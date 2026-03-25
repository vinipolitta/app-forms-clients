import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormTemplateService, FormTemplate, CreateFormTemplateRequest } from '../../core/services/form-template.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-create-template',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-form-template.component.html',
  styleUrls: ['./create-form-template.component.scss']
})
export class CreateTemplateComponent implements OnInit {

  public templateForm: FormGroup;
  public clients: { id: number; name: string }[] = [];

  // 🔹 Propriedades necessárias para template HTML
  public template: FormTemplate | null = null;
  public slug: string | null = null;
  public loading = false;

  constructor(
    private fb: FormBuilder,
    private service: FormTemplateService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.templateForm = this.fb.group({
      name: ['', Validators.required],
      clientId: [null, Validators.required],
      fields: this.fb.array([])
    });
  }

  get fields(): FormArray {
    return this.templateForm.get('fields') as FormArray;
  }

  ngOnInit(): void {
    this.loadClients();

    // 🔹 Carrega template caso exista slug na rota
    this.route.params
      .pipe(
        switchMap(params => {
          const slugParam = params['slug'];
          if (slugParam) {
            this.slug = slugParam;
            this.loading = true;
            return this.service.getTemplateBySlug(slugParam);
          }
          return of(null);
        })
      )
      .subscribe({
        next: (res: FormTemplate | null) => {
          if (res) {
            this.template = res;
            this.loadTemplateToForm(res);
          }
          this.loading = false;
        },
        error: () => {
          console.error('Erro ao carregar template');
          this.loading = false;
        }
      });
  }

  addField() {
    this.fields.push(this.fb.group({
      label: ['', Validators.required],
      type: ['text', Validators.required],
      required: [false]
    }));
  }

  removeField(i: number) {
    this.fields.removeAt(i);
  }

  loadClients() {
    this.service.getAllTemplates().subscribe({
      next: clients => {
        // 👀 Substitua por endpoint real de clientes se tiver
        this.clients = [
          { id: 1, name: 'Cliente 1' },
          { id: 2, name: 'Cliente 2' }
        ];
        this.cdr.detectChanges();
      },
      error: () => console.error('Erro ao carregar clientes')
    });
  }

  submit() {
    if (this.templateForm.invalid) return;

    const payload: CreateFormTemplateRequest = {
      name: this.templateForm.value.name,
      clientId: this.templateForm.value.clientId,
      fields: this.templateForm.value.fields
    };

    this.service.createTemplate(payload.clientId, payload).subscribe({
      next: (res: FormTemplate) => {
        alert('Template criado com sucesso!');
        this.template = res;
        this.slug = res.slug;
        this.loadTemplateToForm(res);
      },
      error: () => alert('Erro ao criar template')
    });
  }

  loadTemplateToForm(template: FormTemplate) {
    this.templateForm.patchValue({
      name: template.name,
      clientId: (template as any).clientId ?? null
    });

    this.fields.clear();
    template.fields.forEach(f => {
      this.fields.push(this.fb.group({
        label: [f.label, Validators.required],
        type: [f.type, Validators.required],
        required: [f.required ?? false]
      }));
    });

    this.cdr.detectChanges();
  }

  // 🔹 Link para preenchimento do formulário
  get formLink(): string {
    return `/forms/${this.template?.slug ?? ''}`;
  }
}