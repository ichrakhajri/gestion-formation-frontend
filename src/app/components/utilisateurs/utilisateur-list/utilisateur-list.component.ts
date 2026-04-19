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

  // Données
  utilisateurs: any[] = [];
  filteredUtilisateurs: any[] = [];
  searchLogin = '';
  loading = false;
  errorMessage = '';

  // Suppression
  showDeleteModal = false;
  utilisateurToDelete: any = null;
  deleteLoading = false;
  deleteSuccess = '';

  // Navbar
  user: User | null  = null;
  isSidebarCollapsed = false;
  isMobileMenuOpen   = false;
  isUserMenuOpen     = false;

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

  private apiUrl = 'http://localhost:8080/api/utilisateurs';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.checkScreenSize();
    this.loadUtilisateurs();
  }

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
        this.deleteLoading       = false;
        this.deleteSuccess       = 'Utilisateur supprimé avec succès.';
        this.utilisateurs        = this.utilisateurs.filter(u => u.id !== this.utilisateurToDelete.id);
        this.filteredUtilisateurs = this.filteredUtilisateurs.filter(u => u.id !== this.utilisateurToDelete.id);
        setTimeout(() => this.closeDeleteModal(), 1200);
      },
      error: () => {
        this.deleteLoading = false;
        this.errorMessage  = 'Erreur lors de la suppression.';
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
