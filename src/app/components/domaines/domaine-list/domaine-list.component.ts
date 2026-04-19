import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { SidebarMixin } from '../../../mixins/sidebar.mixin';

@Component({
  selector: 'app-domaine-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './domaine-list.component.html',
  styleUrl: './domaine-list.component.scss'
})
export class DomaineListComponent extends SidebarMixin implements OnInit {
  domaines: any[]         = [];
  filtered: any[]         = [];
  searchText              = '';
  loading                 = false;
  errorMessage            = '';

  showAddModal            = false;
  addLoading              = false;
  addSuccess              = '';
  addForm: FormGroup;

  showDeleteModal         = false;
  deleteLoading           = false;
  deleteSuccess           = '';
  domaineToDelete: any    = null;

  private apiUrl = 'http://localhost:8080/api/domaines';

  constructor(
    authService: AuthService,
    router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    super(authService, router);
    this.addForm = this.fb.group({
      libelle: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next:  (d) => { this.domaines = d; this.filtered = d; this.loading = false; },
      error: ()  => { this.errorMessage = 'Erreur de chargement.'; this.loading = false; }
    });
  }

  onSearch(): void {
    const q = this.searchText.toLowerCase();
    this.filtered = this.domaines.filter(d => d.libelle.toLowerCase().includes(q));
  }

  clearSearch(): void { this.searchText = ''; this.filtered = this.domaines; }

  // Ajout
  openAdd(): void { this.showAddModal = true; this.addSuccess = ''; this.addForm.reset(); }
  closeAdd(): void { this.showAddModal = false; }

  submitAdd(): void {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.addLoading = true;
    this.http.post<any>(this.apiUrl, this.addForm.value).subscribe({
      next: (d) => {
        this.domaines.push(d);
        this.filtered = [...this.domaines];
        this.addLoading = false;
        this.addSuccess = 'Domaine ajouté avec succès !';
        setTimeout(() => this.closeAdd(), 1200);
      },
      error: () => { this.addLoading = false; this.errorMessage = 'Erreur lors de l\'ajout.'; }
    });
  }

  // Suppression
  openDelete(d: any): void { this.domaineToDelete = d; this.showDeleteModal = true; this.deleteSuccess = ''; }
  closeDelete(): void { this.showDeleteModal = false; this.domaineToDelete = null; }

  confirmDelete(): void {
    if (!this.domaineToDelete) return;
    this.deleteLoading = true;
    this.http.delete(`${this.apiUrl}/${this.domaineToDelete.id}`).subscribe({
      next: () => {
        this.domaines = this.domaines.filter(d => d.id !== this.domaineToDelete.id);
        this.filtered = this.filtered.filter(d => d.id !== this.domaineToDelete.id);
        this.deleteLoading = false;
        this.deleteSuccess = 'Domaine supprimé avec succès.';
        setTimeout(() => this.closeDelete(), 1200);
      },
      error: () => { this.deleteLoading = false; this.errorMessage = 'Erreur suppression.'; }
    });
  }
}
