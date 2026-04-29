import { Component, OnInit } from '@angular/core';
import { SidebarMixin } from '../../../mixins/sidebar.mixin';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-structure-list',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './structure-list.component.html',
  styleUrl: './structure-list.component.scss'
})
export class StructureListComponent extends SidebarMixin implements OnInit {
  structures: any[]         = [];
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
  structureToEdit: any      = null;

  // ── Suppression ──
  showDeleteModal           = false;
  deleteLoading             = false;
  deleteSuccess             = '';
  structureToDelete: any    = null;

  private apiUrl = 'http://localhost:8080/api/structures';

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
        this.structures = data;
        this.filtered   = data;
        this.loading    = false;
      },
      error: (err) => {
        console.error('Erreur de chargement:', err);
        this.errorMessage = 'Erreur de chargement des structures.';
        this.loading      = false;
      }
    });
  }

  // ==================== RECHERCHE ====================
  onSearch(): void {
    const q = this.searchText.toLowerCase();
    this.filtered = this.structures.filter(s =>
      s.libelle && s.libelle.toLowerCase().includes(q)
    );
  }

  clearSearch(): void {
    this.searchText = '';
    this.filtered   = this.structures;
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
      next: (structure) => {
        this.structures.push(structure);
        this.filtered   = [...this.structures];
        this.addLoading = false;
        this.addSuccess = 'Structure ajoutée avec succès !';
        setTimeout(() => this.closeAdd(), 1200);
      },
      error: (err) => {
        console.error('Erreur ajout:', err);
        this.addLoading   = false;
        this.errorMessage = 'Erreur lors de l\'ajout de la structure.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== MODIFICATION ====================
  openEdit(structure: any): void {
    this.structureToEdit = structure;
    this.showEditModal   = true;
    this.editSuccess     = '';
    this.editForm.patchValue({ libelle: structure.libelle });
  }

  closeEdit(): void {
    this.showEditModal   = false;
    this.structureToEdit = null;
  }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.editLoading = true;
    this.http.put<any>(`${this.apiUrl}/${this.structureToEdit.id}`, this.editForm.value).subscribe({
      next: (updated) => {
        const idx = this.structures.findIndex(s => s.id === updated.id);
        if (idx !== -1) this.structures[idx] = updated;
        this.filtered    = [...this.structures];
        this.editLoading = false;
        this.editSuccess = 'Structure modifiée avec succès !';
        setTimeout(() => this.closeEdit(), 1200);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.editLoading  = false;
        this.errorMessage = 'Erreur lors de la modification de la structure.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== SUPPRESSION ====================
  openDelete(structure: any): void {
    this.structureToDelete = structure;
    this.showDeleteModal   = true;
    this.deleteSuccess     = '';
  }

  closeDelete(): void {
    this.showDeleteModal   = false;
    this.structureToDelete = null;
  }

  confirmDelete(): void {
    if (!this.structureToDelete) return;
    this.deleteLoading = true;
    this.http.delete(`${this.apiUrl}/${this.structureToDelete.id}`).subscribe({
      next: () => {
        this.structures    = this.structures.filter(s => s.id !== this.structureToDelete.id);
        this.filtered      = this.filtered.filter(s => s.id !== this.structureToDelete.id);
        this.deleteLoading = false;
        this.deleteSuccess = 'Structure supprimée avec succès.';
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