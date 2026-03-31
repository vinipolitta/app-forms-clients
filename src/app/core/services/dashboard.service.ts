import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TemplateStatResponse {
  id: number;
  name: string;
  clientName?: string;
  submissionCount: number;
  appointmentTotal: number;
  appointmentConfirmed: number;
  attendanceTotal: number;
  attendancePresent: number;
  type?: 'formulario' | 'agendamento' | 'lista-presenca';
  hasSchedule?: boolean;           // se o template tem agendamento
  appointmentCancelled?: number;   // quantidade de agendamentos cancelados
}

export interface DashboardSummary {
  totalTemplates: number;
  totalClients: number;
  totalSubmissions: number;
  totalAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  totalAttendanceRecords: number;
  presentAttendanceRecords: number;
  templates: TemplateStatResponse[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private readonly base = 'http://localhost:8080/dashboard';

  constructor(private http: HttpClient) { }

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.base);
  }
}
