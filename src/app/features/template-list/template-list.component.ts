import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { FormTemplate, FormTemplateService } from '../../core/services/form-template.service';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './template-list.component.html',
  styleUrls: ['./template-list.component.scss']
})
export class TemplateListComponent implements OnInit {
  templates: FormTemplate[] = [];
  service = inject(FormTemplateService);
  route = inject(ActivatedRoute);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.service.getTemplateBySlug(slug).subscribe({
        next: t => this.templates = [t], // mostra apenas o template especificado
        error: () => alert('Formulário não encontrado')
      });
    } else {
      this.service.getAllTemplates().subscribe({
        next: res => this.templates = res,
        error: () => alert('Erro ao carregar formulários')
      });
    }
  }
}