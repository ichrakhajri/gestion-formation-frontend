import { Component, OnInit } from '@angular/core';
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
  domaines: any[]      = [];
  filtered: any[]      = [];
  searchText           = '';
  loading              = false;
  errorMessage         = '';

  // ── Ajout ──
  showAddModal         = false;
  addLoading           = false;
  addSuccess           = '';
  addForm: FormGroup;

  // ── Modification ──
  showEditModal        = false;
  editLoading          = false;
  editSuccess          = '';
  editForm: FormGroup;
  domaineToEdit: any   = null;

  // ── Suppression ──
  showDeleteModal      = false;
  deleteLoading        = false;
  deleteSuccess        = '';
  domaineToDelete: any = null;

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

    this.editForm = this.fb.group({
      libelle: ['', [Validators.required, Validators.minLength(2)]]
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
      next:  (d) => { this.domaines = d; this.filtered = d; this.loading = false; },
      error: ()  => { this.errorMessage = 'Erreur de chargement.'; this.loading = false; }
    });
  }

  // ==================== RECHERCHE ====================
  onSearch(): void {
    const q = this.searchText.toLowerCase();
    this.filtered = this.domaines.filter(d => d.libelle.toLowerCase().includes(q));
  }

  clearSearch(): void { this.searchText = ''; this.filtered = this.domaines; }

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
      next: (d) => {
        this.domaines.push(d);
        this.filtered   = [...this.domaines];
        this.addLoading = false;
        this.addSuccess = 'Domaine ajouté avec succès !';
        setTimeout(() => this.closeAdd(), 1200);
      },
      error: () => {
        this.addLoading  = false;
        this.errorMessage = 'Erreur lors de l\'ajout.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== MODIFICATION ====================
  openEdit(d: any): void {
    this.domaineToEdit = d;
    this.showEditModal = true;
    this.editSuccess   = '';
    this.editForm.patchValue({ libelle: d.libelle });
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.domaineToEdit = null;
  }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.editLoading = true;
    this.http.put<any>(`${this.apiUrl}/${this.domaineToEdit.id}`, this.editForm.value).subscribe({
      next: (updated) => {
        const idx = this.domaines.findIndex(d => d.id === updated.id);
        if (idx !== -1) this.domaines[idx] = updated;
        this.filtered    = [...this.domaines];
        this.editLoading = false;
        this.editSuccess = 'Domaine modifié avec succès !';
        setTimeout(() => this.closeEdit(), 1200);
      },
      error: () => {
        this.editLoading  = false;
        this.errorMessage = 'Erreur lors de la modification.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== SUPPRESSION ====================
  openDelete(d: any): void {
    this.domaineToDelete = d;
    this.showDeleteModal = true;
    this.deleteSuccess   = '';
  }

  closeDelete(): void { this.showDeleteModal = false; this.domaineToDelete = null; }

  confirmDelete(): void {
    if (!this.domaineToDelete) return;
    this.deleteLoading = true;
    this.http.delete(`${this.apiUrl}/${this.domaineToDelete.id}`).subscribe({
      next: () => {
        this.domaines      = this.domaines.filter(d => d.id !== this.domaineToDelete.id);
        this.filtered      = this.filtered.filter(d => d.id !== this.domaineToDelete.id);
        this.deleteLoading = false;
        this.deleteSuccess = 'Domaine supprimé avec succès.';
        setTimeout(() => this.closeDelete(), 1200);
      },
      error: () => {
        this.deleteLoading = false;
        this.errorMessage  = 'Erreur suppression.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }
}