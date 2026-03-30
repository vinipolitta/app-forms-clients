// src/app/core/services/form-template.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface FormField {
  label: string;
  type: string;
  id: number;
  required: boolean;
}

export interface FormTemplate {
  id: number;
  name: string;
  slug: string;
  clientName: string;
  fields: FormField[];
}

export interface CreateFormTemplateRequest {
  name: string;
  clientId: number;
  fields: FormField[];
}

export interface FormSubmission {
  id: number;
  templateId: number;
  values: { [key: string]: string };
  createdAt: string;
}

// 🔥 CORRETO
export interface CreateFormSubmissionRequest {
  templateId: number;
  values: { [key: string]: string };
}

@Injectable({ providedIn: 'root' })
export class FormTemplateService {

  private apiUrl = 'http://localhost:8080/form-templates';
  private submissionsUrl = 'http://localhost:8080/form-submissions';

  constructor(private http: HttpClient) {}

  // ================= TEMPLATES =================

  createTemplate(clientId: number, payload: CreateFormTemplateRequest): Observable<FormTemplate> {
    return this.http.post<FormTemplate>(`${this.apiUrl}/create/${clientId}`, payload);
  }

  getAllTemplates(): Observable<FormTemplate[]> {
    return this.http.get<FormTemplate[]>(this.apiUrl);
  }

  getMyTemplates(): Observable<FormTemplate[]> {
    return this.http.get<FormTemplate[]>(`${this.apiUrl}/my-templates`).pipe(
      tap(res => console.log("TEMPLATES DO USUÁRIO:", res))
    );
  }

  getTemplateBySlug(slug: string): Observable<FormTemplate> {
    return this.http.get<FormTemplate>(`${this.apiUrl}/slug/${slug}`);
  }

  // ================= SUBMISSIONS =================

  submitForm(payload: CreateFormSubmissionRequest): Observable<FormSubmission> {
    return this.http.post<FormSubmission>(this.submissionsUrl, payload);
  }

  // 🔥 NOVO PADRÃO
  getSubmissionsByTemplate(templateId: number): Observable<FormSubmission[]> {
    return this.http.get<FormSubmission[]>(`${this.submissionsUrl}/template/${templateId}`);
  }

  getSubmissionsBySlug(slug: string): Observable<FormSubmission[]> {
    return this.http.get<FormSubmission[]>(`${this.submissionsUrl}/slug/${slug}`);
  }
}