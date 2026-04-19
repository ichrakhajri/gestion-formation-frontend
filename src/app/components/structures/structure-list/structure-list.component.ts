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

  showAddModal              = false;
  addLoading                = false;
  addSuccess                = '';
  addForm: FormGroup;

  showDeleteModal           = false;
  deleteLoading             = false;
  deleteSuccess             = '';
  structureToDelete: any    = null;

  // URL corrigée (sans espace à la fin)
  private apiUrl = 'http://localhost:8080/api/structures';

  constructor(
    authService: AuthService,
    router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    super(authService, router);
    // Utilisation de 'libelle' comme dans l'entité Spring Boot
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
      next: (data) => {
        this.structures = data;
        this.filtered = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement:', err);
        this.errorMessage = 'Erreur de chargement des structures.';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    const q = this.searchText.toLowerCase();
    // Recherche sur le champ 'libelle'
    this.filtered = this.structures.filter(s =>
      s.libelle && s.libelle.toLowerCase().includes(q)
    );
  }

  clearSearch(): void {
    this.searchText = '';
    this.filtered = this.structures;
  }

  // Ajout
  openAdd(): void {
    this.showAddModal = true;
    this.addSuccess = '';
    this.addForm.reset();
  }

  closeAdd(): void {
    this.showAddModal = false;
  }

  submitAdd(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    this.addLoading = true;
    this.http.post<any>(this.apiUrl, this.addForm.value).subscribe({
      next: (structure) => {
        this.structures.push(structure);
        this.filtered = [...this.structures];
        this.addLoading = false;
        this.addSuccess = 'Structure ajoutée avec succès !';
        setTimeout(() => this.closeAdd(), 1200);
      },
      error: (err) => {
        console.error('Erreur ajout:', err);
        this.addLoading = false;
        this.errorMessage = 'Erreur lors de l\'ajout de la structure.';
      }
    });
  }

  // Suppression
  openDelete(structure: any): void {
    this.structureToDelete = structure;
    this.showDeleteModal = true;
    this.deleteSuccess = '';
  }

  closeDelete(): void {
    this.showDeleteModal = false;
    this.structureToDelete = null;
  }

  confirmDelete(): void {
    if (!this.structureToDelete) return;

    this.deleteLoading = true;
    this.http.delete(`${this.apiUrl}/${this.structureToDelete.id}`).subscribe({
      next: () => {
        this.structures = this.structures.filter(s => s.id !== this.structureToDelete.id);
        this.filtered = this.filtered.filter(s => s.id !== this.structureToDelete.id);
        this.deleteLoading = false;
        this.deleteSuccess = 'Structure supprimée avec succès.';
        setTimeout(() => this.closeDelete(), 1200);
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.deleteLoading = false;
        this.errorMessage = 'Erreur lors de la suppression.';
      }
    });
  }
}
