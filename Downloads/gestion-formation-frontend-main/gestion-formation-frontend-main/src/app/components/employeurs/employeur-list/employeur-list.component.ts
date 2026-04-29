import { Component, OnInit } from '@angular/core';
import { SidebarMixin } from '../../../mixins/sidebar.mixin';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employeur-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employeur-list.component.html',
  styleUrl: './employeur-list.component.scss'
})
export class EmployeurListComponent extends SidebarMixin implements OnInit {
  employeurs: any[]         = [];
  filtered: any[]           = [];
  searchText                = '';
  loading                   = false;
  errorMessage              = '';

  // ── Ajout ──
  showAddModal              = false;
  addLoading                = false;
  addSuccess                = '';
  addForm: FormGroup;

  // ── Modification ──
  showEditModal             = false;
  editLoading               = false;
  editSuccess               = '';
  editForm: FormGroup;
  employeurToEdit: any      = null;

  // ── Suppression ──
  showDeleteModal           = false;
  deleteLoading             = false;
  deleteSuccess             = '';
  employeurToDelete: any    = null;

  private apiUrl = 'http://localhost:8080/api/employeurs';

  constructor(
    authService: AuthService,
    router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    super(authService, router);

    this.addForm = this.fb.group({
      nomEmployeur: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.editForm = this.fb.group({
      nomEmployeur: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.load();
  }

  // ==================== CHARGEMENT ====================
  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.employeurs = data;
        this.filtered   = data;
        this.loading    = false;
      },
      error: () => {
        this.errorMessage = 'Erreur de chargement des employeurs.';
        this.loading      = false;
      }
    });
  }

  // ==================== RECHERCHE ====================
  onSearch(): void {
    const q = this.searchText.toLowerCase();
    this.filtered = this.employeurs.filter(e =>
      e.nomEmployeur.toLowerCase().includes(q)
    );
  }

  clearSearch(): void {
    this.searchText = '';
    this.filtered   = this.employeurs;
  }

  // ==================== AJOUT ====================
  openAdd(): void {
    this.showAddModal = true;
    this.addSuccess   = '';
    this.addForm.reset();
  }

  closeAdd(): void { this.showAddModal = false; }

  submitAdd(): void {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.addLoading = true;
    this.http.post<any>(this.apiUrl, this.addForm.value).subscribe({
      next: (employeur) => {
        this.employeurs.push(employeur);
        this.filtered   = [...this.employeurs];
        this.addLoading = false;
        this.addSuccess = 'Employeur ajouté avec succès !';
        setTimeout(() => this.closeAdd(), 1200);
      },
      error: () => {
        this.addLoading   = false;
        this.errorMessage = 'Erreur lors de l\'ajout de l\'employeur.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== MODIFICATION ====================
  openEdit(employeur: any): void {
    this.employeurToEdit = employeur;
    this.showEditModal   = true;
    this.editSuccess     = '';
    this.editForm.patchValue({ nomEmployeur: employeur.nomEmployeur });
  }

  closeEdit(): void {
    this.showEditModal   = false;
    this.employeurToEdit = null;
  }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.editLoading = true;
    this.http.put<any>(`${this.apiUrl}/${this.employeurToEdit.id}`, this.editForm.value).subscribe({
      next: (updated) => {
        const idx = this.employeurs.findIndex(e => e.id === updated.id);
        if (idx !== -1) this.employeurs[idx] = updated;
        this.filtered    = [...this.employeurs];
        this.editLoading = false;
        this.editSuccess = 'Employeur modifié avec succès !';
        setTimeout(() => this.closeEdit(), 1200);
      },
      error: () => {
        this.editLoading  = false;
        this.errorMessage = 'Erreur lors de la modification de l\'employeur.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== SUPPRESSION ====================
  openDelete(employeur: any): void {
    this.employeurToDelete = employeur;
    this.showDeleteModal   = true;
    this.deleteSuccess     = '';
  }

  closeDelete(): void {
    this.showDeleteModal   = false;
    this.employeurToDelete = null;
  }

  confirmDelete(): void {
    if (!this.employeurToDelete) return;
    this.deleteLoading = true;
    this.http.delete(`${this.apiUrl}/${this.employeurToDelete.id}`).subscribe({
      next: () => {
        this.employeurs    = this.employeurs.filter(e => e.id !== this.employeurToDelete.id);
        this.filtered      = this.filtered.filter(e => e.id !== this.employeurToDelete.id);
        this.deleteLoading = false;
        this.deleteSuccess = 'Employeur supprimé avec succès.';
        setTimeout(() => this.closeDelete(), 1200);
      },
      error: () => {
        this.deleteLoading = false;
        this.errorMessage  = 'Erreur lors de la suppression.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }
}