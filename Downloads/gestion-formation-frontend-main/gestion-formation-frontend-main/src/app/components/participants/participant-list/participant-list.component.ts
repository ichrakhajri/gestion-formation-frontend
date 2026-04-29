import { Component, OnInit } from '@angular/core';
import { SidebarMixin } from '../../../mixins/sidebar.mixin';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-participant-list',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './participant-list.component.html',
  styleUrl: './participant-list.component.scss'
})
export class ParticipantListComponent extends SidebarMixin implements OnInit {
  participants: any[] = [];
  filtered: any[] = [];
  searchText = '';
  loading = false;
  errorMessage = '';

  // ── Ajout ──
  showAddModal = false;
  addLoading = false;
  addSuccess = '';
  addForm: FormGroup;

  // ── Modification ──
  showEditModal = false;
  editLoading = false;
  editSuccess = '';
  editForm: FormGroup;
  participantToEdit: any = null;

  // ── Suppression ──
  showDeleteModal = false;
  deleteLoading = false;
  deleteSuccess = '';
  participantToDelete: any = null;

  // ── Détail formations du participant ──
  showDetailModal = false;
  selectedParticipant: any = null;
  participantFormations: any[] = [];
  detailLoading = false;

  // ── Données pour les selects ──
  structures: any[] = [];
  profils: any[] = [];

  private apiUrl        = 'http://localhost:8080/api/participants';
  private structuresUrl = 'http://localhost:8080/api/structures';
  private profilsUrl    = 'http://localhost:8080/api/profils';
  private formationsUrl = 'http://localhost:8080/api/formations';

  constructor(
    authService: AuthService,
    router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    super(authService, router);

    this.addForm = this.fb.group({
      nom:     ['', [Validators.required, Validators.minLength(2)]],
      prenom:  ['', [Validators.required, Validators.minLength(2)]],
      email:   ['', [Validators.required, Validators.email]],
      tel:     ['', [Validators.pattern('^[0-9]{8}$')]],
      structure: this.fb.group({ id: ['', Validators.required] }),
      profil:    this.fb.group({ id: ['', Validators.required] })
    });

    this.editForm = this.fb.group({
      nom:     ['', [Validators.required, Validators.minLength(2)]],
      prenom:  ['', [Validators.required, Validators.minLength(2)]],
      email:   ['', [Validators.required, Validators.email]],
      tel:     ['', [Validators.pattern('^[0-9]{8}$')]],
      structure: this.fb.group({ id: ['', Validators.required] }),
      profil:    this.fb.group({ id: ['', Validators.required] })
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.load();
    this.loadStructures();
    this.loadProfils();
  }

  // ==================== CHARGEMENT ====================
  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.participants = data;
        this.filtered     = data;
        this.loading      = false;
      },
      error: (err) => {
        console.error('Erreur de chargement:', err);
        this.errorMessage = 'Erreur de chargement des participants.';
        this.loading = false;
      }
    });
  }

  loadStructures(): void {
    this.http.get<any[]>(this.structuresUrl).subscribe({
      next:  (data) => { this.structures = data; },
      error: (err)  => console.error('Erreur chargement structures:', err)
    });
  }

  loadProfils(): void {
    this.http.get<any[]>(this.profilsUrl).subscribe({
      next:  (data) => { this.profils = data; },
      error: (err)  => console.error('Erreur chargement profils:', err)
    });
  }

  // ==================== RECHERCHE ====================
  onSearch(): void {
    const q = this.searchText.toLowerCase();
    this.filtered = this.participants.filter(p =>
      p.nom?.toLowerCase().includes(q) ||
      p.prenom?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  }

  clearSearch(): void {
    this.searchText = '';
    this.filtered   = this.participants;
  }

  // ==================== DÉTAIL DES FORMATIONS ====================
  openDetail(participant: any): void {
    this.selectedParticipant   = participant;
    this.showDetailModal       = true;
    this.participantFormations = [];
    this.detailLoading         = true;

    this.http.get<any[]>(this.formationsUrl).subscribe({
      next: (formations) => {
        this.participantFormations = formations.filter(f =>
          f.participants?.some((p: any) => p.id === participant.id)
        );
        this.detailLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement formations:', err);
        this.detailLoading = false;
        this.errorMessage  = 'Erreur lors du chargement des formations.';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  closeDetail(): void {
    this.showDetailModal       = false;
    this.selectedParticipant   = null;
    this.participantFormations = [];
  }

  getDomaineLibelle(formation: any): string {
    if (!formation?.domaine) return '-';
    return formation.domaine.libelle || '-';
  }

  // ==================== AJOUT ====================
  openAdd(): void {
    this.showAddModal = true;
    this.addSuccess   = '';
    this.addForm.reset();
    this.addForm.patchValue({
      structure: { id: '' },
      profil:    { id: '' }
    });
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
    const v = this.addForm.value;
    const payload = {
      nom:       v.nom,
      prenom:    v.prenom,
      email:     v.email,
      tel:       v.tel,
      structure: { id: v.structure.id },
      profil:    { id: v.profil.id }
    };

    this.http.post<any>(this.apiUrl, payload).subscribe({
      next: (participant) => {
        this.participants.push(participant);
        this.filtered   = [...this.participants];
        this.addLoading = false;
        this.addSuccess = 'Participant ajouté avec succès !';
        setTimeout(() => this.closeAdd(), 1200);
      },
      error: (err) => {
        console.error('Erreur ajout:', err);
        this.addLoading = false;
        if (err.status === 400 && err.error?.errors) {
          this.errorMessage = err.error.errors.map((e: any) => e.message).join(', ');
        } else if (err.status === 409) {
          this.errorMessage = 'Cet email existe déjà.';
        } else {
          this.errorMessage = 'Erreur lors de l\'ajout du participant.';
        }
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== MODIFICATION ====================
  openEdit(participant: any): void {
    this.participantToEdit = participant;
    this.showEditModal     = true;
    this.editSuccess       = '';
    this.editForm.patchValue({
      nom:       participant.nom,
      prenom:    participant.prenom,
      email:     participant.email,
      tel:       participant.tel || '',
      structure: { id: participant.structure?.id || '' },
      profil:    { id: participant.profil?.id    || '' }
    });
  }

  closeEdit(): void {
    this.showEditModal     = false;
    this.participantToEdit = null;
  }

  submitEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.editLoading = true;
    const v = this.editForm.value;
    const payload = {
      nom:       v.nom,
      prenom:    v.prenom,
      email:     v.email,
      tel:       v.tel,
      structure: { id: v.structure.id },
      profil:    { id: v.profil.id }
    };

    this.http.put<any>(`${this.apiUrl}/${this.participantToEdit.id}`, payload).subscribe({
      next: (updated) => {
        const idx = this.participants.findIndex(p => p.id === updated.id);
        if (idx !== -1) this.participants[idx] = updated;
        this.filtered    = [...this.participants];
        this.editLoading = false;
        this.editSuccess = 'Participant modifié avec succès !';
        setTimeout(() => this.closeEdit(), 1200);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.editLoading = false;
        if (err.status === 409) {
          this.errorMessage = 'Cet email existe déjà.';
        } else {
          this.errorMessage = 'Erreur lors de la modification du participant.';
        }
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== SUPPRESSION ====================
  openDelete(participant: any): void {
    this.participantToDelete = participant;
    this.showDeleteModal     = true;
    this.deleteSuccess       = '';
  }

  closeDelete(): void {
    this.showDeleteModal     = false;
    this.participantToDelete = null;
  }

  confirmDelete(): void {
    if (!this.participantToDelete) return;

    this.deleteLoading = true;
    this.http.delete(`${this.apiUrl}/${this.participantToDelete.id}`).subscribe({
      next: () => {
        this.participants   = this.participants.filter(p => p.id !== this.participantToDelete.id);
        this.filtered       = this.filtered.filter(p => p.id !== this.participantToDelete.id);
        this.deleteLoading  = false;
        this.deleteSuccess  = 'Participant supprimé avec succès.';
        setTimeout(() => this.closeDelete(), 1200);
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.deleteLoading = false;
        this.errorMessage  = 'Erreur lors de la suppression. Ce participant est peut-être inscrit à une formation.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ==================== AFFICHAGE ====================
  getStructureNom(participant: any): string {
    if (!participant) return '-';
    if (participant.structure?.libelle) return participant.structure.libelle;
    if (participant.structure?.id) {
      const found = this.structures.find(s => s.id === participant.structure.id);
      return found ? found.libelle : '-';
    }
    return '-';
  }

  getProfilLibelle(participant: any): string {
    if (!participant) return '-';
    if (participant.profil?.libelle) return participant.profil.libelle;
    if (participant.profil?.id) {
      const found = this.profils.find(p => p.id === participant.profil.id);
      return found ? found.libelle : '-';
    }
    return '-';
  }
}