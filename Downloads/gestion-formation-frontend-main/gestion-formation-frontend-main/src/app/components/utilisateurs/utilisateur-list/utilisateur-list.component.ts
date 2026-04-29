import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-utilisateur-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './utilisateur-list.component.html',
  styleUrl: './utilisateur-list.component.scss'
})
export class UtilisateurListComponent implements OnInit {

  // ── Données ──────────────────────────────────────────
  utilisateurs: any[]          = [];
  filteredUtilisateurs: any[]  = [];
  searchLogin                  = '';
  loading                      = false;
  errorMessage                 = '';

  // ── Modification ─────────────────────────────────────
  showEditModal                = false;
  editLoading                  = false;
  editSuccess                  = '';
  editError                    = '';
  utilisateurToEdit: any       = null;
  editLogin                    = '';
  editPassword                 = '';
  editRoleId                   = '';
  roles: any[]                 = [];

  // ── Suppression ──────────────────────────────────────
  showDeleteModal              = false;
  utilisateurToDelete: any     = null;
  deleteLoading                = false;
  deleteSuccess                = '';

  // ── Navbar ───────────────────────────────────────────
  user: User | null            = null;
  isSidebarCollapsed           = false;
  isMobileMenuOpen             = false;
  isUserMenuOpen               = false;

  menuItems = [
    { label: 'Tableau de bord', icon: 'fas fa-tachometer-alt',    route: '/dashboard',    description: '', roles: ['administrateur', 'simple utilisateur', 'responsable'] },
    { label: 'Formations',      icon: 'fas fa-graduation-cap',    route: '/formations',   description: '', roles: ['administrateur', 'simple utilisateur', 'responsable'] },
    { label: 'Participants',    icon: 'fas fa-users',              route: '/participants', description: '', roles: ['administrateur', 'simple utilisateur'] },
    { label: 'Formateurs',      icon: 'fas fa-chalkboard-teacher', route: '/formateurs',  description: '', roles: ['administrateur', 'simple utilisateur'] },
    { label: 'Statistiques',    icon: 'fas fa-chart-line',         route: '/statistiques',description: '', roles: ['administrateur', 'responsable'] },
    { label: 'Utilisateurs',    icon: 'fas fa-user-shield',        route: '/utilisateurs',description: '', roles: ['administrateur'] },
    { label: 'Domaines',        icon: 'fas fa-tags',               route: '/domaines',    description: '', roles: ['administrateur'] },
    { label: 'Structures',      icon: 'fas fa-building',           route: '/structures',  description: '', roles: ['administrateur'] },
    { label: 'Profils',         icon: 'fas fa-id-card',            route: '/profils',     description: '', roles: ['administrateur'] },
    { label: 'Employeurs',      icon: 'fas fa-briefcase',          route: '/employeurs',  description: '', roles: ['administrateur'] },
  ];

  private apiUrl   = 'http://localhost:8080/api/utilisateurs';
  private rolesUrl = 'http://localhost:8080/api/roles';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.checkScreenSize();
    this.loadUtilisateurs();
    this.loadRoles();
  }

  // ── Chargement ───────────────────────────────────────
  loadUtilisateurs(): void {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.utilisateurs         = data;
        this.filteredUtilisateurs = data;
        this.loading              = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des utilisateurs.';
        this.loading      = false;
      }
    });
  }

  loadRoles(): void {
    this.http.get<any[]>(this.rolesUrl).subscribe({
      next:  (data) => { this.roles = data; },
      error: ()     => console.error('Erreur chargement rôles')
    });
  }

  // ── Recherche ────────────────────────────────────────
  onSearch(): void {
    const q = this.searchLogin.toLowerCase().trim();
    this.filteredUtilisateurs = this.utilisateurs.filter(u =>
      u.login.toLowerCase().includes(q)
    );
  }

  clearSearch(): void {
    this.searchLogin          = '';
    this.filteredUtilisateurs = this.utilisateurs;
  }

  // ── Modification ─────────────────────────────────────
  openEditModal(utilisateur: any): void {
    this.utilisateurToEdit = utilisateur;
    this.showEditModal     = true;
    this.editSuccess       = '';
    this.editError         = '';
    this.editLogin         = utilisateur.login;
    this.editPassword      = '';
    this.editRoleId        = utilisateur.role?.id ?? '';
  }

  closeEditModal(): void {
    this.showEditModal     = false;
    this.utilisateurToEdit = null;
    this.editError         = '';
  }

  confirmEdit(): void {
    if (!this.editLogin.trim()) {
      this.editError = 'Le login est obligatoire.';
      return;
    }
    if (!this.editRoleId) {
      this.editError = 'Le rôle est obligatoire.';
      return;
    }

    this.editLoading = true;
    this.editError   = '';

    const payload: any = {
      login: this.editLogin,
      role:  { id: Number(this.editRoleId) }
    };
    if (this.editPassword.trim()) {
      payload.password = this.editPassword;
    }

    this.http.put<any>(`${this.apiUrl}/${this.utilisateurToEdit.id}`, payload).subscribe({
      next: () => {
        const selectedRole = this.roles.find(r => r.id === Number(this.editRoleId));

        const idx = this.utilisateurs.findIndex(u => u.id === this.utilisateurToEdit.id);
        if (idx !== -1) {
          this.utilisateurs[idx] = {
            ...this.utilisateurs[idx],
            login: this.editLogin,
            role:  selectedRole
          };
        }

        const fidx = this.filteredUtilisateurs.findIndex(u => u.id === this.utilisateurToEdit.id);
        if (fidx !== -1) {
          this.filteredUtilisateurs[fidx] = {
            ...this.filteredUtilisateurs[fidx],
            login: this.editLogin,
            role:  selectedRole
          };
        }

        this.utilisateurs         = [...this.utilisateurs];
        this.filteredUtilisateurs = [...this.filteredUtilisateurs];

        this.editLoading = false;
        this.editSuccess = 'Utilisateur modifié avec succès.';
        setTimeout(() => this.closeEditModal(), 1200);
      },
      error: () => {
        this.editLoading = false;
        this.editError   = 'Erreur lors de la modification.';
      }
    });
  }

  // ── Suppression ──────────────────────────────────────
  openDeleteModal(utilisateur: any): void {
    this.utilisateurToDelete = utilisateur;
    this.showDeleteModal     = true;
    this.deleteSuccess       = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal     = false;
    this.utilisateurToDelete = null;
  }

  confirmDelete(): void {
    if (!this.utilisateurToDelete) return;
    this.deleteLoading = true;

    this.http.delete(`${this.apiUrl}/${this.utilisateurToDelete.id}`).subscribe({
      next: () => {
        this.deleteLoading        = false;
        this.deleteSuccess        = 'Utilisateur supprimé avec succès.';
        this.utilisateurs         = this.utilisateurs.filter(u => u.id !== this.utilisateurToDelete.id);
        this.filteredUtilisateurs = this.filteredUtilisateurs.filter(u => u.id !== this.utilisateurToDelete.id);
        setTimeout(() => this.closeDeleteModal(), 1200);
      },
      error: () => {
        this.deleteLoading = false;
        this.errorMessage  = 'Erreur lors de la suppression.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  // ── Navbar ───────────────────────────────────────────
  @HostListener('window:resize')
  checkScreenSize() {
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed = true;
      this.isMobileMenuOpen   = false;
    }
  }

  get visibleMenuItems() {
    return this.menuItems.filter(i => i.roles.includes(this.user?.role ?? ''));
  }

  toggleSidebar():    void { this.isSidebarCollapsed = !this.isSidebarCollapsed; }
  toggleMobileMenu(): void { this.isMobileMenuOpen   = !this.isMobileMenuOpen; }
  toggleUserMenu():   void { this.isUserMenuOpen      = !this.isUserMenuOpen; }

  getRoleIcon(): string {
    switch (this.user?.role) {
      case 'administrateur': return 'fas fa-crown';
      case 'responsable':    return 'fas fa-chart-simple';
      default:               return 'fas fa-user';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
