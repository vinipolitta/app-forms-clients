import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormTemplate, FormTemplateService } from '../../core/services/form-template.service';

@Component({
  selector: 'app-forms-all',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './forms-all.component.html',
  styleUrls: ['./forms-all.component.scss']
})
export class FormsAllComponent implements OnInit {
  service = inject(FormTemplateService);
  templates: FormTemplate[] = [];

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.service.getAllTemplates().subscribe({
      next: (res) => {
        this.templates = res;
        console.log("@@@@@", res);
        
      },
      error: () => alert('Erro ao carregar formulários')
    });
  }
}