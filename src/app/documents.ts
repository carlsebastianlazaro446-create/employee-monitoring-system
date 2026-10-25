import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from './employee-service';
import { DocCategory, EmployeeDocument } from './models';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

@Component({
  selector: 'app-documents',
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h1>Employee Documents</h1>
    </div>

    <div class="cards">
      <div class="card"><span>Total Documents</span><strong>{{ svc.documents().length }}</strong></div>
      <div class="card"><span>Employees With Documents</span><strong>{{ withDocs() }}</strong></div>
      <div class="card"><span>Missing a Contract</span><strong>{{ missingContract().length }}</strong></div>
    </div>

    @if (missingContract().length) {
      <p class="muted">No contract on file: {{ missingNames() }}</p>
    }

    <form class="panel form leave-form" (ngSubmit)="upload(fileInput)">
      <h2>Upload a document</h2>
      <div class="grid">
        <label>Employee
          <select name="employeeId" [(ngModel)]="employeeId">
            <option [ngValue]="0" disabled>Select employee</option>
            @for (e of svc.employees(); track e.id) {
              <option [ngValue]="e.id">{{ e.name }}</option>
            }
          </select>
        </label>
        <label>Category
          <select name="category" [(ngModel)]="category">
            @for (c of categories; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </label>
        <label class="wide">File (PDF, image or Word, up to 10 MB)
          <input #fileInput type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
        </label>
      </div>
      @if (error()) { <p class="error">{{ error() }}</p> }
      <div class="actions">
        <button type="submit" class="btn primary">Upload</button>
      </div>
    </form>

    <div class="toolbar">
      <select [(ngModel)]="filterEmployee">
        <option [ngValue]="0">All employees</option>
        @for (e of svc.employees(); track e.id) {
          <option [ngValue]="e.id">{{ e.name }}</option>
        }
      </select>
      <select [(ngModel)]="filterCategory">
        <option value="">All categories</option>
        @for (c of categories; track c) {
          <option [value]="c">{{ c }}</option>
        }
      </select>
    </div>

    <div class="panel table-wrap">
      <table>
        <thead>
          <tr><th>Employee</th><th>Category</th><th>File</th><th>Size</th><th>Uploaded</th><th></th></tr>
        </thead>
        <tbody>
          @for (d of filtered(); track d.id) {
            <tr>
              <td>{{ nameOf(d.employeeId) }}</td>
              <td>{{ d.category }}</td>
              <td>{{ d.fileName }}</td>
              <td>{{ size(d.size) }}</td>
              <td>{{ d.uploadedOn }}</td>
              <td class="row-actions">
                <button class="btn small" (click)="view(d)">View</button>
                <button class="btn small" (click)="download(d)">Download</button>
                <button class="btn small danger" (click)="remove(d)">Delete</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="empty">No documents uploaded yet.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class Documents {
  svc = inject(EmployeeService);

  categories: DocCategory[] = ['Contract', 'Government ID', 'Resume', 'Certificate', 'Medical', 'Clearance', 'Other'];

  employeeId = 0;
  category: DocCategory = 'Contract';
  error = signal('');

  filterEmployee = signal(0);
  filterCategory = signal('');

  filtered = computed(() =>
    this.svc
      .documents()
      .filter(
        (d) =>
          (!this.filterEmployee() || d.employeeId === this.filterEmployee()) &&
          (!this.filterCategory() || d.category === this.filterCategory())
      )
  );

  withDocs = computed(() => new Set(this.svc.documents().map((d) => d.employeeId)).size);

  missingContract = computed(() =>
    this.svc
      .employees()
      .filter(
        (e) =>
          e.status !== 'Inactive' &&
          !this.svc.documents().some((d) => d.employeeId === e.id && d.category === 'Contract')
      )
  );

  missingNames = computed(() => this.missingContract().map((e) => e.name).join(', '));

  nameOf(id: number) {
    return this.svc.employees().find((e) => e.id === id)?.name ?? 'Unknown';
  }

  size(bytes: number) {
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  upload(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!this.employeeId) return this.error.set('Please select an employee.');
    if (!file) return this.error.set('Please choose a file.');
    if (file.size > MAX_BYTES) return this.error.set('File is larger than 10 MB.');

    this.svc.addDocument(this.employeeId, this.category, file);
    input.value = '';
    this.error.set('');
  }

  view(d: EmployeeDocument) {
    window.open(d.url, '_blank');
  }

  download(d: EmployeeDocument) {
    const a = document.createElement('a');
    a.href = d.url;
    a.download = d.fileName;
    a.click();
  }

  remove(d: EmployeeDocument) {
    if (confirm(`Delete ${d.fileName}?`)) this.svc.removeDocument(d.id);
  }
}