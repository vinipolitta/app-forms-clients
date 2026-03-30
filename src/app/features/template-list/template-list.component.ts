import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormTemplateService, FormTemplate, FormSubmission } from '../../core/services/form-template.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './template-list.component.html'
})
export class TemplateListComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private service = inject(FormTemplateService);

  template = signal<FormTemplate | null>(null);
  submissions = signal<FormSubmission[]>([]);
  columns = signal<string[]>([]);
  loading = signal(true);

  // 🔥 filtros
  filterText = signal('');
  startDate = signal('');
  endDate = signal('');

  // 🔥 ordenação
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;

    this.service.getTemplateBySlug(slug).subscribe({
      next: (template) => {
        this.template.set(template);

        this.service.getSubmissionsByTemplate(template.id).subscribe({
          next: (subs) => {
            this.submissions.set(subs);
            this.buildColumns(subs);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }

  private buildColumns(subs: FormSubmission[]) {
    const keys = new Set<string>();

    subs.forEach(sub => {
      Object.keys(sub.values || {}).forEach(k => keys.add(k));
    });

    this.columns.set(Array.from(keys).sort());
  }

  // 🔥 FILTRO + ORDENAÇÃO
  filteredSubmissions = computed(() => {
    let data = [...this.submissions()];

    // 🔎 filtro texto
    if (this.filterText()) {
      const text = this.filterText().toLowerCase();

      data = data.filter(sub =>
        Object.values(sub.values || {})
          .some(v => String(v).toLowerCase().includes(text))
      );
    }

    // 📅 filtro data
    if (this.startDate()) {
      data = data.filter(sub => sub.createdAt >= this.startDate());
    }

    if (this.endDate()) {
      data = data.filter(sub => sub.createdAt <= this.endDate());
    }

    // 🔃 ordenação
    if (this.sortColumn()) {
      const col = this.sortColumn();
      const dir = this.sortDirection();

      data.sort((a, b) => {
        const aVal = col === 'createdAt'
          ? a.createdAt
          : a.values?.[col!] ?? '';

        const bVal = col === 'createdAt'
          ? b.createdAt
          : b.values?.[col!] ?? '';

        return dir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return data;
  });

  // 🔥 ordenar
  sort(col: string) {
    if (this.sortColumn() === col) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set('asc');
    }
  }

  getValue(sub: FormSubmission, col: string): string {
    return sub.values?.[col] ?? '-';
  }

  formatLabel(label: string): string {
    return label.replace(/_/g, ' ').toUpperCase();
  }
}