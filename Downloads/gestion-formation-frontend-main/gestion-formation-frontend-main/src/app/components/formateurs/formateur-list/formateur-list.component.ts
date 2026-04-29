import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { SidebarMixin } from '../../../mixins/sidebar.mixin';

@Component({
  selector: 'app-formateur-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './formateur-list.component.html',
  styleUrl: './formateur-list.component.scss'
})
export class FormateurListComponent extends SidebarMixin implements OnInit {
  formateurs: any[]  = [];
  filtered: any[]    = [];
  employeurs: any[]  = [];
  searchText         = '';
  loading            = false;
  errorMessage       = '';

  // ── Ajout ──
  showAddModal       = false;
  addLoading         = false;
  addSuccess         = '';
  addForm: FormGroup;

  // ── Modification ──
  showEditModal      = false;
  editLoading        = false;
  editSuccess        = '';
  editForm: FormGroup;
  toEdit: any        = null;

  // ── Suppression ──
  showDeleteModal    = false;
  deleteLoading      = false;
  deleteSuccess      = '';
  toDelete: any      = null;

  private apiUrl       = 'http://localhost:8080/api/formateurs';
  private employeurUrl = 'http://localhost:8080/api/employeurs';

  constructor(
    authService: AuthService,
    router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    super(authService, router);

    this.addForm = this.fb.group({
      nom:         ['', Validators.required],
      prenom:      ['', Validators.required],
      email:       ['', [Validators.required, Validators.email]],
      tel:         ['', [Validators.pattern('^[0-9]{8}$')]],
      type:        ['', Validators.required],
      employeurId: ['']
    });

    this.editForm = this.fb.group({
      nom:         ['', Validators.required],
      prenom:      ['', Validators.required],
      email:       ['', [Validators.required, Validators.email]],
      tel:         ['', [Validators.pattern('^[0-9]{8}$')]],
      type:        ['', Validators.required],
      employeurId: ['']
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.load();
    this.http.get<any[]>(this.employeurUrl).subscribe(d => this.employeurs = d);
  }

  // ==================== CHARGEMENT ====================
  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next:  (d) => { this.formateurs = d; this.filtered = d; this.loading = false; },
      error: ()  => { this.errorMessage = 'Erreur de chargement.'; this.loading = false; }
    });
  }

  // ==================== RECHERCHE ====================
  onSearch(): void {
    const q = this.searchText.toLowerCase();
    this.filtered = this.formateurs.filter(f =>
      f.nom.toLowerCase().includes(q) || f.prenom.toLowerCase().includes(q)
    );
  }

  clearSearch(): void { this.searchText = ''; this.filtered = this.formateurs; }

  // ==================== COMPTEURS ====================
  getFormateursInternesCount(): number {
    return this.formateurs.filter(f => f.type === 'interne').length;
  }

  getFormateursExternesCount(): number {
    return this.formateurs.filter(f => f.type === 'externe').length;
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
    const v = this.addForm.value;
    const payload = {
      nom:      v.nom,
      prenom:   v.prenom,
      email:    v.email,
      tel:      v.tel,
      type:     v.type,
      employeur: v.employeurId ? { id: Number(v.employeurId) } : null
    };
    this.http.post<any>(this.apiUrl, payload).subscribe({
      next: (d) => {
        this.formateurs.push(d);
        this.filtered   = [...this.formateurs];
        this.addLoading = false;
        this.addSuccess = 'Formateur ajouté avec succès !';
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
  openEdit(f: any): void {
    this.toEdit       = f;
    this.showEditModal = true;
    this.editSuccess   = '';
    this.editForm.patchValue({
      nom:         f.nom,
      prenom:      f.prenom,
      email:       f.email,
      tel:         f.tel || '',
      type:        f.type,
      employeurId: f.employeur?.id || ''
    });
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.toEdit        = null;
  }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.editLoading = true;
    const v = this.editForm.value;
    const payload = {
      nom:      v.nom,
      prenom:   v.prenom,
      email:    v.email,
      tel:      v.tel,
      type:     v.type,
      employeur: v.employeurId ? { id: Number(v.employeurId) } : null
    };
    this.http.put<any>(`${this.apiUrl}/${this.toEdit.id}`, payload).subscribe({
      next: (updated) => {
        const idx = this.formateurs.findIndex(f => f.id === updated.id);
        if (idx !== -1) this.formateurs[idx] = updated;
        this.filtered    = [...this.formateurs];
        this.editLoading = false;
        this.editSuccess = 'Formateur modifié avec succès !';
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
  openDelete(f: any): void {
    this.toDelete       = f;
    this.showDeleteModal = true;
    this.deleteSuccess   = '';
  }

  closeDelete(): void {
    this.showDeleteModal = false;
    this.toDelete        = null;
  }

  confirmDelete(): void {
    if (!this.toDelete) return;
    this.deleteLoading = true;
    this.http.delete(`${this.apiUrl}/${this.toDelete.id}`).subscribe({
      next: () => {
        this.formateurs    = this.formateurs.filter(f => f.id !== this.toDelete.id);
        this.filtered      = this.filtered.filter(f => f.id !== this.toDelete.id);
        this.deleteLoading = false;
        this.deleteSuccess = 'Formateur supprimé avec succès.';
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