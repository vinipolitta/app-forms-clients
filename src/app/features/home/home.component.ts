import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface TemplateStatResponse {
  id: number;
  name: string;
  type: 'formulario' | 'agendamento' | 'lista-presenca';
  clientName: string;
  submissionCount: number;
  appointmentTotal: number;
  appointmentConfirmed: number;
}

interface KpiSummary {
  [key: string]: {
    totalTemplates: number;
    totalSubmissions: number;
    confirmedAppointments: number;
    attendancePercent: number;
  };
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  templates: TemplateStatResponse[] = [];
  selectedTemplate: TemplateStatResponse | null = null;
  chart: Chart | null = null;
  loadingData = false;

  constructor() { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loadingData = true;

    setTimeout(() => {
      // Dados reais simulados (exemplo presenca-motorola)
      this.templates = [
        { id: 1, name: 'motorola-forms', type: 'formulario', clientName: 'Motorola', submissionCount: 2, appointmentTotal: 0, appointmentConfirmed: 0 },
        { id: 2, name: 'agendamento-motorola', type: 'agendamento', clientName: 'Motorola', submissionCount: 0, appointmentTotal: 2, appointmentConfirmed: 1 },
        { id: 3, name: 'presenca-motorola', type: 'lista-presenca', clientName: 'Motorola', submissionCount: 0, appointmentTotal: 16, appointmentConfirmed: 7 },
        { id: 4, name: 'natura-lista-presenca', type: 'lista-presenca', clientName: 'Natura', submissionCount: 0, appointmentTotal: 0, appointmentConfirmed: 0 },
        { id: 5, name: 'teste', type: 'formulario', clientName: 'Natura', submissionCount: 0, appointmentTotal: 0, appointmentConfirmed: 0 }
      ];
      this.loadingData = false;
      this.renderChart();
    }, 500);
  }

  selectTemplate(t: TemplateStatResponse) {
    this.selectedTemplate = t;
    this.renderChart();
  }

  selected() {
    return this.selectedTemplate;
  }

  showAll() {
    this.selectedTemplate = null;
    this.renderChart();
  }

  loading() {
    return this.loadingData;
  }

  attendancePercent(t: TemplateStatResponse) {
    if (t.appointmentTotal === 0) return 0;
    return (t.appointmentConfirmed / t.appointmentTotal) * 100;
  }

  kpiSummary(): KpiSummary {
    const summary: KpiSummary = {};

    ['formulario','agendamento','lista-presenca'].forEach(type => {
      const filtered = this.templates.filter(t => t.type === type);
      const totalSubmissions = filtered.reduce((acc, t) => acc + t.submissionCount, 0);
      const confirmedAppointments = filtered.reduce((acc, t) => acc + t.appointmentConfirmed, 0);
      const attendancePercent = filtered.length
        ? filtered.reduce((acc, t) => acc + this.attendancePercent(t), 0) / filtered.length
        : 0;

      summary[type] = {
        totalTemplates: filtered.length,
        totalSubmissions,
        confirmedAppointments,
        attendancePercent
      };
    });

    return summary;
  }

  selectedKpi(): KpiSummary {
    const sel = this.selected();
    const kpi = this.kpiSummary();
    if (!sel) return kpi;

    const type = sel.type;
    return {
      [type]: {
        totalTemplates: 1,
        totalSubmissions: sel.submissionCount,
        confirmedAppointments: sel.appointmentConfirmed,
        attendancePercent: this.attendancePercent(sel)
      }
    };
  }

  renderChart() {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const sel = this.selected();
    const kpi = this.kpiSummary();

    const labels = sel ? ['Submissões', 'Confirmados', 'Presença'] : ['Formulários','Agendamentos','Presença'];
    const data = sel
      ? [sel.submissionCount, sel.appointmentConfirmed, this.attendancePercent(sel)]
      : [kpi['formulario'].totalTemplates, kpi['agendamento'].totalTemplates, kpi['lista-presenca'].totalTemplates];

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: sel ? sel.name : 'Resumo Geral',
          data,
          backgroundColor: ['#3498db', '#2ecc71', '#e67e22']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  exportDashboard() {
    alert('Função de exportar ainda não implementada.');
  }

}