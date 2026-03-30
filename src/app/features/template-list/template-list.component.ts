import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormTemplateService, FormTemplate, FormSubmission } from '../../core/services/form-template.service';
import { FormsModule } from '@angular/forms';

interface FilterableField {
  col: string;
  label: string;
  filterType: 'text' | 'select' | 'number' | 'daterange';
  uniqueVals: string[];
}

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.scss'
})
export class TemplateListComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private service = inject(FormTemplateService);

  template = signal<FormTemplate | null>(null);
  submissions = signal<FormSubmission[]>([]);
  columns = signal<string[]>([]);
  loading = signal(true);

  globalSearch = signal('');
  fieldFilters = signal<Record<string, string>>({});
  filtersOpen = signal(true);

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
    subs.forEach(sub => Object.keys(sub.values || {}).forEach(k => keys.add(k)));
    this.columns.set(Array.from(keys).sort());
  }

  filterableFields = computed((): FilterableField[] => {
    const cols = this.columns();
    const subs = this.submissions();
    const templateFields = this.template()?.fields ?? [];

    const fields: FilterableField[] = [
      { col: 'createdAt', label: 'Data', filterType: 'daterange', uniqueVals: [] }
    ];

    for (const col of cols) {
      const templateField = templateFields.find(f =>
        f.label.toLowerCase().replace(/\s+/g, '_') === col ||
        f.label.toLowerCase() === col.replace(/_/g, ' ').toLowerCase()
      );

      const uniqueVals = [...new Set(
        subs.map(s => s.values?.[col]).filter((v): v is string => !!v)
      )].sort();

      let filterType: FilterableField['filterType'] = 'text';
      if (templateField?.type === 'date') filterType = 'daterange';
      else if (templateField?.type === 'number') filterType = 'number';
      else if (templateField?.type === 'select' || templateField?.type === 'radio') filterType = 'select';
      else if (uniqueVals.length > 0 && uniqueVals.length <= 10) filterType = 'select';

      fields.push({ col, label: this.formatLabel(col), filterType, uniqueVals });
    }

    return fields;
  });

  activeFiltersList = computed(() => {
    const filters = this.fieldFilters();
    const result: { col: string; label: string; value: string; key: string }[] = [];

    for (const key of Object.keys(filters)) {
      if (!filters[key]) continue;
      const isStart = key.endsWith('__start');
      const isEnd = key.endsWith('__end');
      const col = isStart ? key.replace('__start', '') : isEnd ? key.replace('__end', '') : key;
      const label = col === 'createdAt' ? 'Data' : this.formatLabel(col);
      const value = isStart ? `de ${filters[key]}` : isEnd ? `até ${filters[key]}` : filters[key];
      result.push({ col, label, value, key });
    }

    return result;
  });

  activeFiltersCount = computed(() => {
    const fieldCount = Object.values(this.fieldFilters()).filter(v => !!v).length;
    return fieldCount + (this.globalSearch() ? 1 : 0);
  });

  filteredSubmissions = computed(() => {
    let data = [...this.submissions()];
    const search = this.globalSearch().toLowerCase().trim();
    const filters = this.fieldFilters();

    if (search) {
      data = data.filter(sub =>
        Object.values(sub.values || {}).some(v => String(v).toLowerCase().includes(search)) ||
        sub.id.toString().includes(search)
      );
    }

    for (const key of Object.keys(filters)) {
      const val = filters[key];
      if (!val) continue;

      if (key === 'createdAt__start') {
        data = data.filter(sub => sub.createdAt.substring(0, 10) >= val);
      } else if (key === 'createdAt__end') {
        data = data.filter(sub => sub.createdAt.substring(0, 10) <= val);
      } else if (key.endsWith('__start')) {
        const col = key.replace('__start', '');
        data = data.filter(sub => (sub.values?.[col] ?? '') >= val);
      } else if (key.endsWith('__end')) {
        const col = key.replace('__end', '');
        data = data.filter(sub => (sub.values?.[col] ?? '') <= val);
      } else {
        data = data.filter(sub =>
          String(sub.values?.[key] ?? '').toLowerCase().includes(val.toLowerCase())
        );
      }
    }

    const col = this.sortColumn();
    if (col) {
      const dir = this.sortDirection();
      data.sort((a, b) => {
        const aVal = col === 'createdAt' ? a.createdAt : (a.values?.[col] ?? '');
        const bVal = col === 'createdAt' ? b.createdAt : (b.values?.[col] ?? '');
        return dir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return data;
  });

  sort(col: string) {
    if (this.sortColumn() === col) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set('asc');
    }
  }

  sortIcon(col: string): string {
    if (this.sortColumn() !== col) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  getFieldFilter(key: string): string {
    return this.fieldFilters()[key] ?? '';
  }

  setFieldFilter(key: string, value: string) {
    this.fieldFilters.update(f => ({ ...f, [key]: value }));
  }

  clearFilter(key: string) {
    this.fieldFilters.update(f => {
      const updated = { ...f };
      delete updated[key];
      return updated;
    });
  }

  clearAllFilters() {
    this.globalSearch.set('');
    this.fieldFilters.set({});
  }

  getValue(sub: FormSubmission, col: string): string {
    return sub.values?.[col] ?? '-';
  }

  formatLabel(label: string): string {
    return label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
