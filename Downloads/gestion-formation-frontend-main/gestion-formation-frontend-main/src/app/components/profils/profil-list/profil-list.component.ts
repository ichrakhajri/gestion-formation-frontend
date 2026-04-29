import { Component, OnInit } from '@angular/core';
import { SidebarMixin } from '../../../mixins/sidebar.mixin';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profil-list',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './profil-list.component.html',
  styleUrl: './profil-list.component.scss'
})
export class ProfilListComponent extends SidebarMixin implements OnInit {
  profils: any[]        = [];
  filtered: any[]       = [];
  searchText            = '';
  loading               = false;
  errorMessage          = '';

  // ── Ajout ──
  showAddModal          = false;
  addLoading            = false;
  addSuccess            = '';
  addForm: FormGroup;

  // ── Modification ──
  showEditModal         = false;
  editLoading           = false;
  editSuccess           = '';
  editForm: FormGroup;
  profilToEdit: any     = null;

  // ── Suppression ──
  showDeleteModal       = false;
  deleteLoading         = false;
  deleteSuccess         = '';
  profilToDelete: any   = null;

  private apiUrl = 'http://localhost:8080/api/profils';

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
      next: (data) => {
        this.profils  = data;
        this.filtered = data;
        this.loading  = false;
      },
      error: (err) => {
        console.error('Erreur de chargement:', err);
        this.errorMessage = 'Erreur de chargement des profils.';
        this.loading      = false;
      }
    });
  }

  // ==================== RECHERCHE ====================
  onSearch(): void {
    const q = this.searchText.toLowerCase();
    this.filtered = this.profils.filter(p =>
      p.libelle && p.libelle.toLowerCase().includes(q)
    );
  }

  clearSearch(): void {
    this.searchText = '';
    this.filtered   = this.profils;
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
      next: (profil) => {
        this.profils.push(profil);
        this.filtered   = [...this.profils];
        this.addLoading = false;
        this.addSuccess = 'Profil ajouté avec succès !';
        setTimeout(() => this.closeAdd(), 1200);
      },
      error: (err) => {
        console.error('Erreur ajout:', err);
        this.addLoading   = false;
        this.errorMessage = 'Erreur lors de l\'ajout du profil.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== MODIFICATION ====================
  openEdit(profil: any): void {
    this.profilToEdit  = profil;
    this.showEditModal = true;
    this.editSuccess   = '';
    this.editForm.patchValue({ libelle: profil.libelle });
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.profilToEdit  = null;
  }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.editLoading = true;
    this.http.put<any>(`${this.apiUrl}/${this.profilToEdit.id}`, this.editForm.value).subscribe({
      next: (updated) => {
        const idx = this.profils.findIndex(p => p.id === updated.id);
        if (idx !== -1) this.profils[idx] = updated;
        this.filtered    = [...this.profils];
        this.editLoading = false;
        this.editSuccess = 'Profil modifié avec succès !';
        setTimeout(() => this.closeEdit(), 1200);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.editLoading  = false;
        this.errorMessage = 'Erreur lors de la modification du profil.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== SUPPRESSION ====================
  openDelete(profil: any): void {
    this.profilToDelete  = profil;
    this.showDeleteModal = true;
    this.deleteSuccess   = '';
  }

  closeDelete(): void {
    this.showDeleteModal = false;
    this.profilToDelete  = null;
  }

  confirmDelete(): void {
    if (!this.profilToDelete) return;
    this.deleteLoading = true;
    this.http.delete(`${this.apiUrl}/${this.profilToDelete.id}`).subscribe({
      next: () => {
        this.profils       = this.profils.filter(p => p.id !== this.profilToDelete.id);
        this.filtered      = this.filtered.filter(p => p.id !== this.profilToDelete.id);
        this.deleteLoading = false;
        this.deleteSuccess = 'Profil supprimé avec succès.';
        setTimeout(() => this.closeDelete(), 1200);
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.deleteLoading = false;
        this.errorMessage  = 'Erreur lors de la suppression.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }
}