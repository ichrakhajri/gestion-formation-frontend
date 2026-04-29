import { Component, OnInit } from '@angular/core';
import { SidebarMixin } from '../../../mixins/sidebar.mixin';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-formation-list',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './formation-list.component.html',
  styleUrl: './formation-list.component.scss'
})
export class FormationListComponent extends SidebarMixin implements OnInit {
  formations: any[] = [];
  filtered: any[] = [];
  searchText = '';
  loading = false;
  errorMessage = '';

  // Modals
  showAddModal = false;
  showEditModal = false;
  showParticipantsModal = false;
  showDeleteModal = false;

  // États
  addLoading = false;
  editLoading = false;
  deleteLoading = false;
  addSuccess = '';
  editSuccess = '';
  deleteSuccess = '';

  // Données
  addForm: FormGroup;
  editForm: FormGroup;
  formationToDelete: any = null;
  formationToEdit: any = null;
  selectedFormation: any = null;
  availableParticipants: any[] = [];
  selectedParticipantId: number | null = null;
  addParticipantLoading = false;
  addParticipantSuccess = '';
  removeParticipantLoading = false;

  // Champs pour l'ajout de participants dans le modal d'ajout
  showParticipantSelector = false;
  tempSelectedParticipants: any[] = [];
  tempSelectedParticipantId: number | null = null;

  // Données pour les selects
  domaines: any[] = [];
  formateurs: any[] = [];

  private apiUrl = 'http://localhost:8080/api/formations';
  private domainesUrl = 'http://localhost:8080/api/domaines';
  private formateursUrl = 'http://localhost:8080/api/formateurs';
  private participantsUrl = 'http://localhost:8080/api/participants';

  constructor(
    authService: AuthService,
    router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    super(authService, router);

    this.addForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      annee: ['', [Validators.required, Validators.min(2024), Validators.max(2030), Validators.pattern('^[0-9]{4}$')]],
      duree: ['', [Validators.required, Validators.min(1), Validators.max(365), Validators.pattern('^[0-9]+$')]],
      budget: ['', [Validators.required, Validators.min(100), Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]],
      domaine: this.fb.group({ id: ['', Validators.required] }),
      formateur: this.fb.group({ id: [''] })
    });

    this.editForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      annee: ['', [Validators.required, Validators.min(2024), Validators.max(2030), Validators.pattern('^[0-9]{4}$')]],
      duree: ['', [Validators.required, Validators.min(1), Validators.max(365), Validators.pattern('^[0-9]+$')]],
      budget: ['', [Validators.required, Validators.min(100), Validators.pattern('^[0-9]+(\\.[0-9]{1,2})?$')]],
      domaine: this.fb.group({ id: ['', Validators.required] }),
      formateur: this.fb.group({ id: [''] })
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.load();
    this.loadDomaines();
    this.loadFormateurs();
    this.loadAvailableParticipants();
  }

  load(): void {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => { this.formations = data; this.filtered = data; this.loading = false; },
      error: (err) => { console.error('Erreur de chargement:', err); this.errorMessage = 'Erreur de chargement des formations.'; this.loading = false; }
    });
  }

  loadDomaines(): void {
    this.http.get<any[]>(this.domainesUrl).subscribe({
      next: (data) => this.domaines = data,
      error: (err) => console.error('Erreur chargement domaines:', err)
    });
  }

  loadFormateurs(): void {
    this.http.get<any[]>(this.formateursUrl).subscribe({
      next: (data) => this.formateurs = data,
      error: (err) => console.error('Erreur chargement formateurs:', err)
    });
  }

  loadAvailableParticipants(): void {
    this.http.get<any[]>(this.participantsUrl).subscribe({
      next: (data) => this.availableParticipants = data,
      error: (err) => console.error('Erreur chargement participants:', err)
    });
  }

  onSearch(): void {
    const q = this.searchText.toLowerCase();
    this.filtered = this.formations.filter(f => f.titre?.toLowerCase().includes(q));
  }

  clearSearch(): void {
    this.searchText = '';
    this.filtered = this.formations;
  }

  // ── Modal Ajout ──────────────────────────────────────────────────────────

  openAdd(): void {
    this.showAddModal = true;
    this.addSuccess = '';
    this.showParticipantSelector = false;
    this.tempSelectedParticipants = [];
    this.tempSelectedParticipantId = null;
    this.addForm.reset();
    this.addForm.patchValue({ domaine: { id: '' }, formateur: { id: '' } });
  }

  closeAdd(): void {
    this.showAddModal = false;
    this.showParticipantSelector = false;
    this.tempSelectedParticipants = [];
  }

  toggleParticipantSelector(): void {
    this.showParticipantSelector = !this.showParticipantSelector;
    this.tempSelectedParticipantId = null;
  }

  addTempParticipant(): void {
    if (!this.tempSelectedParticipantId) { this.errorMessage = 'Veuillez sélectionner un participant.'; return; }
    const participant = this.availableParticipants.find(p => p.id === this.tempSelectedParticipantId);
    if (participant && !this.tempSelectedParticipants.some(p => p.id === participant.id)) {
      this.tempSelectedParticipants.push(participant);
      this.tempSelectedParticipantId = null;
      this.addSuccess = 'Participant ajouté à la liste.';
      setTimeout(() => this.addSuccess = '', 2000);
    } else {
      this.errorMessage = 'Ce participant est déjà dans la liste.';
      setTimeout(() => this.errorMessage = '', 2000);
    }
  }

  removeTempParticipant(participantId: number): void {
    this.tempSelectedParticipants = this.tempSelectedParticipants.filter(p => p.id !== participantId);
  }

  submitAdd(): void {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.addLoading = true;
    const formValue = this.addForm.value;
    const formationData = {
      titre: formValue.titre,
      annee: formValue.annee,
      duree: formValue.duree,
      budget: formValue.budget,
      domaine: { id: formValue.domaine.id },
      formateur: formValue.formateur.id ? { id: formValue.formateur.id } : null,
      participants: []
    };

    this.http.post<any>(this.apiUrl, formationData).subscribe({
      next: (formation) => {
        if (this.tempSelectedParticipants.length === 0) {
          this.formations.push(formation);
          this.filtered = [...this.formations];
          this.addLoading = false;
          this.addSuccess = 'Formation ajoutée avec succès !';
          setTimeout(() => this.closeAdd(), 1500);
          return;
        }
        const addRequests = this.tempSelectedParticipants.map(p =>
          this.http.post(`${this.apiUrl}/${formation.id}/participants/${p.id}`, {})
        );
        let completed = 0;
        addRequests.forEach(request => {
          request.subscribe({
            next: () => {
              completed++;
              if (completed === addRequests.length) {
                this.http.get<any>(`${this.apiUrl}/${formation.id}`).subscribe({
                  next: (updatedFormation) => {
                    this.formations.push(updatedFormation);
                    this.filtered = [...this.formations];
                    this.addLoading = false;
                    this.addSuccess = `Formation ajoutée avec ${completed} participant(s) !`;
                    setTimeout(() => this.closeAdd(), 1500);
                  }
                });
              }
            },
            error: (err) => {
              console.error('Erreur ajout participant:', err);
              this.addLoading = false;
              this.errorMessage = 'Formation créée mais erreur lors de l\'ajout des participants.';
            }
          });
        });
      },
      error: (err) => {
        console.error('Erreur ajout:', err);
        this.addLoading = false;
        this.errorMessage = 'Erreur lors de l\'ajout de la formation.';
      }
    });
  }

  // ── Modal Modification ───────────────────────────────────────────────────

  openEdit(formation: any): void {
    this.formationToEdit = formation;
    this.showEditModal = true;
    this.editSuccess = '';
    this.editForm.reset();
    this.editForm.patchValue({
      titre: formation.titre,
      annee: formation.annee,
      duree: formation.duree,
      budget: formation.budget,
      domaine: { id: formation.domaine?.id ?? null },
      formateur: { id: formation.formateur?.id ?? null }
    });
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.formationToEdit = null;
    this.editSuccess = '';
  }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.editLoading = true;
    const formValue = this.editForm.value;
    const formationData = {
      titre: formValue.titre,
      annee: formValue.annee,
      duree: formValue.duree,
      budget: formValue.budget,
      domaine: { id: formValue.domaine.id },
      formateur: formValue.formateur.id ? { id: formValue.formateur.id } : null
    };

    this.http.put<any>(`${this.apiUrl}/${this.formationToEdit.id}`, formationData).subscribe({
      next: (updatedFormation) => {
        // Merge participants back (API PUT might not return them)
        updatedFormation.participants = this.formationToEdit.participants;
        const index = this.formations.findIndex(f => f.id === updatedFormation.id);
        if (index !== -1) {
          this.formations[index] = updatedFormation;
          this.filtered = [...this.formations];
          this.onSearch();
        }
        this.editLoading = false;
        this.editSuccess = 'Formation modifiée avec succès !';
        setTimeout(() => this.closeEdit(), 1500);
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.editLoading = false;
        this.errorMessage = 'Erreur lors de la modification de la formation.';
      }
    });
  }

  // ── Modal Suppression ────────────────────────────────────────────────────

  openDelete(formation: any): void {
    this.formationToDelete = formation;
    this.showDeleteModal = true;
    this.deleteSuccess = '';
  }

  closeDelete(): void {
    this.showDeleteModal = false;
    this.formationToDelete = null;
  }

  confirmDelete(): void {
    if (!this.formationToDelete) return;
    this.deleteLoading = true;
    this.http.delete(`${this.apiUrl}/${this.formationToDelete.id}`).subscribe({
      next: () => {
        this.formations = this.formations.filter(f => f.id !== this.formationToDelete.id);
        this.filtered = this.filtered.filter(f => f.id !== this.formationToDelete.id);
        this.deleteLoading = false;
        this.deleteSuccess = 'Formation supprimée avec succès.';
        setTimeout(() => this.closeDelete(), 1200);
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.deleteLoading = false;
        this.errorMessage = 'Erreur lors de la suppression.';
      }
    });
  }

  // ── Modal Participants ───────────────────────────────────────────────────

  openManageParticipants(formation: any): void {
    this.selectedFormation = formation;
    this.showParticipantsModal = true;
    this.addParticipantSuccess = '';
    this.selectedParticipantId = null;
    this.loadAvailableParticipants();
  }

  closeManageParticipants(): void {
    this.showParticipantsModal = false;
    this.selectedFormation = null;
    this.selectedParticipantId = null;
  }

  addParticipantToFormation(): void {
    if (!this.selectedParticipantId) { this.errorMessage = 'Veuillez sélectionner un participant.'; return; }
    this.addParticipantLoading = true;
    this.http.post(`${this.apiUrl}/${this.selectedFormation.id}/participants/${this.selectedParticipantId}`, {}).subscribe({
      next: () => {
        this.http.get<any>(`${this.apiUrl}/${this.selectedFormation.id}`).subscribe({
          next: (updatedFormation) => {
            this.selectedFormation = updatedFormation;
            const index = this.formations.findIndex(f => f.id === updatedFormation.id);
            if (index !== -1) { this.formations[index] = updatedFormation; this.filtered[index] = updatedFormation; }
            this.addParticipantLoading = false;
            this.addParticipantSuccess = 'Participant ajouté à la formation avec succès !';
            this.selectedParticipantId = null;
            setTimeout(() => this.addParticipantSuccess = '', 2000);
          },
          error: () => { this.addParticipantLoading = false; this.errorMessage = 'Erreur lors du rechargement.'; }
        });
      },
      error: (err) => { console.error('Erreur ajout participant:', err); this.addParticipantLoading = false; this.errorMessage = 'Erreur lors de l\'ajout du participant.'; }
    });
  }

  removeParticipantFromFormation(participantId: number): void {
    this.removeParticipantLoading = true;
    this.http.delete(`${this.apiUrl}/${this.selectedFormation.id}/participants/${participantId}`).subscribe({
      next: () => {
        this.http.get<any>(`${this.apiUrl}/${this.selectedFormation.id}`).subscribe({
          next: (updatedFormation) => {
            this.selectedFormation = updatedFormation;
            const index = this.formations.findIndex(f => f.id === updatedFormation.id);
            if (index !== -1) { this.formations[index] = updatedFormation; this.filtered[index] = updatedFormation; }
            this.removeParticipantLoading = false;
          },
          error: () => this.removeParticipantLoading = false
        });
      },
      error: (err) => { console.error('Erreur suppression participant:', err); this.removeParticipantLoading = false; }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  isParticipantInFormation(participantId: number): boolean {
    if (!this.selectedFormation?.participants) return false;
    return this.selectedFormation.participants.some((p: any) => p.id === participantId);
  }

  getAvailableParticipants(): any[] {
    if (!this.selectedFormation?.participants) return this.availableParticipants;
    const enrolledIds = this.selectedFormation.participants.map((p: any) => p.id);
    return this.availableParticipants.filter(p => !enrolledIds.includes(p.id));
  }

  getTempAvailableParticipants(): any[] {
    const selectedIds = this.tempSelectedParticipants.map(p => p.id);
    return this.availableParticipants.filter(p => !selectedIds.includes(p.id));
  }

  getDomaineLibelle(formation: any): string {
    if (!formation || !formation.domaine) return '-';
    if (formation.domaine.libelle) return formation.domaine.libelle;
    if (formation.domaine.id) {
      const domaine = this.domaines.find(d => d.id === formation.domaine.id);
      return domaine ? domaine.libelle : '-';
    }
    return '-';
  }

  getFormateurNom(formation: any): string {
    if (!formation || !formation.formateur) return 'Non assigné';
    if (formation.formateur.prenom && formation.formateur.nom) return `${formation.formateur.prenom} ${formation.formateur.nom}`;
    if (formation.formateur.id) {
      const formateur = this.formateurs.find(f => f.id === formation.formateur.id);
      return formateur ? `${formateur.prenom} ${formateur.nom}` : 'Non assigné';
    }
    return 'Non assigné';
  }

  getParticipantCount(formation: any): number {
    return formation?.participants?.length || 0;
  }
}