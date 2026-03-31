import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardSummary, TemplateStatResponse } from '../../core/services/dashboard.service';
import { ExportService } from '../../core/services/export.service';
import { Chart, ChartConfiguration } from 'chart.js/auto';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {

  private dashboardService = inject(DashboardService);
  private exportService = inject(ExportService);
  private cdr = inject(ChangeDetectorRef);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);
  selected = signal<TemplateStatResponse | null>(null);

  chart: Chart | null = null;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  displaySummary = computed(() => {
    const s = this.summary();
    const sel = this.selected();

    if (!s) return null;

    if (sel) {
      return {
        totalTemplates: 1,
        totalSubmissions: sel.submissionCount,
        totalAppointments: sel.appointmentTotal,
        confirmedAppointments: sel.appointmentConfirmed,
        totalAttendanceRecords: sel.attendanceTotal,
        presentAttendanceRecords: sel.attendancePresent
      };
    }

    // Geral
    const totalTemplates = s.templates.length;
    const totalSubmissions = s.templates.reduce((acc, t) => acc + t.submissionCount, 0);
    const totalAppointments = s.templates.reduce((acc, t) => acc + t.appointmentTotal, 0);
    const confirmedAppointments = s.templates.reduce((acc, t) => acc + t.appointmentConfirmed, 0);
    const totalAttendanceRecords = s.templates.reduce((acc, t) => acc + t.attendanceTotal, 0);
    const presentAttendanceRecords = s.templates.reduce((acc, t) => acc + t.attendancePresent, 0);

    return {
      totalTemplates,
      totalSubmissions,
      totalAppointments,
      confirmedAppointments,
      totalAttendanceRecords,
      presentAttendanceRecords
    };
  });

  attendanceRate = computed(() => {
    const s = this.displaySummary();
    if (!s || s.totalAttendanceRecords === 0) return 0;
    return Math.round((s.presentAttendanceRecords / s.totalAttendanceRecords) * 100);
  });

  confirmRate = computed(() => {
    const s = this.displaySummary();
    if (!s || s.totalAppointments === 0) return 0;
    return Math.round((s.confirmedAppointments / s.totalAppointments) * 100);
  });

  ngOnInit() {
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
        this.cdr.detectChanges(); // forçar renderização
            this.showAll();
      },
      error: () => this.loading.set(false)
    });

  }

  ngAfterViewInit() {
    // Se não houver seleção, renderiza gráfico geral
    if (!this.selected()) {
      setTimeout(() => this.renderChart(null), 0);
    }
  }

  selectTemplate(t: TemplateStatResponse) {
    this.selected.set(t);
    setTimeout(() => this.renderChart(t), 0);
  }

  showAll() {
    this.selected.set(null);
    setTimeout(() => this.renderChart(null), 0);
  }

  renderChart(t: TemplateStatResponse | null = null) {
    if (!this.summary() || !this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    let config: ChartConfiguration;

    if (t) {
      // gráfico do template selecionado
      config = {
        type: 'bar',
        data: {
          labels: ['Submissões', 'Agendamentos', 'Confirmados', 'Presentes'],
          datasets: [{
            label: t.clientName || t.name,
            data: [t.submissionCount, t.appointmentTotal, t.appointmentConfirmed, t.attendancePresent],
            backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      };
    } else {
      // gráfico geral
      const s = this.summary()!;
      const labels = s.templates.map(tpl => tpl.clientName || tpl.name);
      const submissionData = s.templates.map(tpl => tpl.submissionCount);
      const appointmentData = s.templates.map(tpl => tpl.appointmentTotal);
      const confirmedData = s.templates.map(tpl => tpl.appointmentConfirmed);
      const presentData = s.templates.map(tpl => tpl.attendancePresent);

      config = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Submissões', data: submissionData, backgroundColor: '#4f46e5', borderRadius: 4 },
            { label: 'Agendamentos', data: appointmentData, backgroundColor: '#10b981', borderRadius: 4 },
            { label: 'Confirmados', data: confirmedData, backgroundColor: '#f59e0b', borderRadius: 4 },
            { label: 'Presentes', data: presentData, backgroundColor: '#3b82f6', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { y: { beginAtZero: true } }
        }
      };
    }

    if (this.chart) this.chart.destroy();
    this.chart = new Chart(ctx, config);
  }

  attendancePercent(t: TemplateStatResponse) {
    if (!t.attendanceTotal) return 0;
    return Math.round((t.attendancePresent / t.attendanceTotal) * 100);
  }

  exportDashboard() {
    if (!this.summary()) return;
    this.exportService.exportDashboard(this.summary()!);
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }
}