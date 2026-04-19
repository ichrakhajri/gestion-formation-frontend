import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navbar-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar-admin.component.html',
  styleUrl: './navbar-admin.component.scss'
})
export class NavbarAdminComponent implements OnInit {
  user: User | null = null;
  isSidebarCollapsed = false;
  isMobileMenuOpen = false;
  isUserMenuOpen = false;

  // Menu items with icons and roles
  menuItems = [
    { label: 'Tableau de bord', icon: 'fas fa-tachometer-alt', route: '/dashboard', roles: ['administrateur', 'simple utilisateur', 'responsable'] },
    { label: 'Formations', icon: 'fas fa-graduation-cap', route: '/formations', roles: ['administrateur', 'simple utilisateur', 'responsable'] },
    { label: 'Participants', icon: 'fas fa-users', route: '/participants', roles: ['administrateur', 'simple utilisateur'] },
    { label: 'Formateurs', icon: 'fas fa-chalkboard-teacher', route: '/formateurs', roles: ['administrateur', 'simple utilisateur'] },
    { label: 'Statistiques', icon: 'fas fa-chart-line', route: '/stats', roles: ['administrateur', 'responsable'] },
    { label: 'Utilisateurs', icon: 'fas fa-user-shield', route: '/utilisateurs', roles: ['administrateur'] },
    { label: 'Domaines', icon: 'fas fa-tags', route: '/domaines', roles: ['administrateur'] },
    { label: 'Structures', icon: 'fas fa-building', route: '/structures', roles: ['administrateur'] },
    { label: 'Profils', icon: 'fas fa-id-card', route: '/profils', roles: ['administrateur'] },
    { label: 'Employeurs', icon: 'fas fa-briefcase', route: '/employeurs', roles: ['administrateur'] }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.checkScreenSize();
  }
// Ajoutez cette méthode dans navbar-admin.component.ts
getPageTitle(): string {
  const currentRoute = this.router.url;
  const menuItem = this.menuItems.find(item => currentRoute.includes(item.route));
  return menuItem?.label || 'Tableau de bord';
}
  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobileMenuOpen = window.innerWidth < 768 ? false : this.isMobileMenuOpen;
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed = true;
    }
  }

  get visibleMenuItems() {
    return this.menuItems.filter(item =>
      item.roles.includes(this.user?.role ?? '')
    );
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRoleBadgeClass(): string {
    switch (this.user?.role) {
      case 'administrateur':
        return 'bg-red-100 text-red-700';
      case 'responsable':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getRoleIcon(): string {
    switch (this.user?.role) {
      case 'administrateur':
        return 'fas fa-crown';
      case 'responsable':
        return 'fas fa-chart-simple';
      default:
        return 'fas fa-user';
    }
  }
}
