import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  user: User | null  = null;
  isSidebarCollapsed = false;
  isMobileMenuOpen   = false;
  isUserMenuOpen     = false;
  today              = '';

  stats = { formations: 0, participants: 0, formateurs: 0 };

  menuItems = [
    {
      label: 'Formations',    icon: 'fas fa-graduation-cap',
      route: '/formations',   description: 'Gérer les sessions',
      bgColor: 'bg-blue-50',  iconColor: 'text-blue-600',
      roles: ['administrateur', 'utilisateur', 'responsable']
    },
    {
      label: 'Participants',  icon: 'fas fa-users',
      route: '/participants', description: 'Gérer les inscrits',
      bgColor: 'bg-green-50', iconColor: 'text-green-600',
      roles: ['administrateur', 'utilisateur']
    },
    {
      label: 'Formateurs',    icon: 'fas fa-chalkboard-teacher',
      route: '/formateurs',   description: 'Gérer les formateurs',
      bgColor: 'bg-amber-50', iconColor: 'text-amber-600',
      roles: ['administrateur', 'utilisateur']
    },
    {
      label: 'Statistiques',  icon: 'fas fa-chart-line',
      route: '/statistiques', description: 'Consulter les stats',
      bgColor: 'bg-purple-50',iconColor: 'text-purple-600',
      roles: ['administrateur', 'responsable']
    },
    {
      label: 'Utilisateurs',  icon: 'fas fa-user-shield',
      route: '/utilisateurs', description: 'Gérer les comptes',
      bgColor: 'bg-red-50',   iconColor: 'text-red-500',
      roles: ['administrateur']
    },
    {
      label: 'Domaines',      icon: 'fas fa-tags',
      route: '/domaines',     description: 'Gérer les domaines',
      bgColor: 'bg-orange-50',iconColor: 'text-orange-500',
      roles: ['administrateur']
    },
    {
      label: 'Structures',    icon: 'fas fa-building',
      route: '/structures',   description: 'Gérer les structures',
      bgColor: 'bg-teal-50',  iconColor: 'text-teal-600',
      roles: ['administrateur']
    },
    {
      label: 'Profils',       icon: 'fas fa-id-card',
      route: '/profils',      description: 'Gérer les profils',
      bgColor: 'bg-indigo-50',iconColor: 'text-indigo-600',
      roles: ['administrateur']
    },
    {
      label: 'Employeurs',    icon: 'fas fa-briefcase',
      route: '/employeurs',   description: 'Gérer les employeurs',
      bgColor: 'bg-pink-50',  iconColor: 'text-pink-500',
      roles: ['administrateur']
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.user  = this.authService.getUser();
    this.today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    this.checkScreenSize();
    this.loadStats();
  }

  loadStats(): void {
    this.http.get<any[]>('http://localhost:8080/api/formations').subscribe({
      next: (d) => this.stats.formations = d.length, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/participants').subscribe({
      next: (d) => this.stats.participants = d.length, error: () => {}
    });
    this.http.get<any[]>('http://localhost:8080/api/formateurs').subscribe({
      next: (d) => this.stats.formateurs = d.length, error: () => {}
    });
  }

  getWelcomeMessage(): string {
    switch (this.user?.role) {
      case 'administrateur':
        return 'Vous avez un accès complet. Gérez les utilisateurs, formations, formateurs et toutes les configurations.';
      case 'responsable':
        return 'Consultez les statistiques et suivez les activités de formation du centre.';
      default:
        return 'Gérez les formations, participants et formateurs depuis ce tableau de bord.';
    }
  }

  @HostListener('window:resize')
  checkScreenSize() {
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed = true;
      this.isMobileMenuOpen   = false;
    }
  }

  get visibleMenuItems() {
    const role = this.user?.role?.trim().toLowerCase() ?? '';
    return this.menuItems.filter(i =>
      i.roles.map(r => r.toLowerCase()).includes(role)
    );
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
