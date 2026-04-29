import { Directive, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Directive()
export class SidebarMixin implements OnInit {
  user: User | null  = null;
  isSidebarCollapsed = false;
  isMobileMenuOpen   = false;
  isUserMenuOpen     = false;

  menuItems = [
    { label: 'Tableau de bord', icon: 'fas fa-tachometer-alt',     route: '/dashboard',    roles: ['administrateur', 'utilisateur', 'responsable'] },
    { label: 'Formations',      icon: 'fas fa-graduation-cap',     route: '/formations',   roles: ['administrateur', 'utilisateur', 'responsable'] },
    { label: 'Participants',    icon: 'fas fa-users',               route: '/participants', roles: ['administrateur', 'utilisateur'] },
    { label: 'Formateurs',      icon: 'fas fa-chalkboard-teacher',  route: '/formateurs',  roles: ['administrateur', 'utilisateur'] },
    { label: 'Statistiques',    icon: 'fas fa-chart-line',          route: '/statistiques', roles: ['administrateur', 'responsable'] },
    { label: 'Utilisateurs',    icon: 'fas fa-user-shield',         route: '/utilisateurs', roles: ['administrateur'] },
    { label: 'Domaines',        icon: 'fas fa-tags',                route: '/domaines',     roles: ['administrateur'] },
    { label: 'Structures',      icon: 'fas fa-building',            route: '/structures',   roles: ['administrateur'] },
    { label: 'Profils',         icon: 'fas fa-id-card',             route: '/profils',      roles: ['administrateur'] },
    { label: 'Employeurs',      icon: 'fas fa-briefcase',           route: '/employeurs',   roles: ['administrateur'] },
  ];

  constructor(protected authService: AuthService, protected router: Router) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.checkScreenSize();
  }

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
