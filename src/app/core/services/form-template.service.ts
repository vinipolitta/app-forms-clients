import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FormField {
  label: string;
  type: string;
  required: boolean;
}

export interface FormTemplate {
  id: number;
  name: string;
  slug: string;
  fields: FormField[];
}

export interface CreateFormTemplateRequest {
  name: string;
  clientId: number;
  fields: FormField[];
}

@Injectable({ providedIn: 'root' })
export class FormTemplateService {
  private apiUrl = 'http://localhost:8080/form-templates';

  constructor(private http: HttpClient) {}

  // ADMIN
  createTemplate(clientId: number, payload: CreateFormTemplateRequest): Observable<FormTemplate> {
    return this.http.post<FormTemplate>(`${this.apiUrl}/create/${clientId}`, payload);
  }

  getAllTemplates(): Observable<FormTemplate[]> {
    return this.http.get<FormTemplate[]>(this.apiUrl);
  }

  // USUÁRIO LOGADO
  getMyTemplates(): Observable<FormTemplate[]> {
    return this.http.get<FormTemplate[]>(`${this.apiUrl}/my-templates`);
  }

  getTemplateBySlug(slug: string): Observable<FormTemplate> {
    return this.http.get<FormTemplate>(`${this.apiUrl}/slug/${slug}`);
  }
}