import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-add-utilisateur',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-utilisateur.component.html',
  styleUrl: './add-utilisateur.component.scss'
})
export class AddUtilisateurComponent implements OnInit {

  // Form
  form: FormGroup;
  loading        = false;
  successMessage = '';
  errorMessage   = '';
  roles: any[]   = [];

  // Navbar
  user: User | null      = null;
  isSidebarCollapsed     = false;
  isMobileMenuOpen       = false;
  isUserMenuOpen         = false;

  menuItems = [
    { label: 'Tableau de bord', icon: 'fas fa-tachometer-alt', route: '/dashboard',    roles: ['administrateur', 'simple utilisateur', 'responsable'] },
    { label: 'Formations',      icon: 'fas fa-graduation-cap', route: '/formations',   roles: ['administrateur', 'simple utilisateur', 'responsable'] },
    { label: 'Participants',    icon: 'fas fa-users',          route: '/participants', roles: ['administrateur', 'simple utilisateur'] },
    { label: 'Formateurs',      icon: 'fas fa-chalkboard-teacher', route: '/formateurs', roles: ['administrateur', 'simple utilisateur'] },
    { label: 'Statistiques',    icon: 'fas fa-chart-line',     route: '/stats',        roles: ['administrateur', 'responsable'] },
    { label: 'Utilisateurs',    icon: 'fas fa-user-shield',    route: '/utilisateurs', roles: ['administrateur'] },
    { label: 'Domaines',        icon: 'fas fa-tags',           route: '/domaines',     roles: ['administrateur'] },
    { label: 'Structures',      icon: 'fas fa-building',       route: '/structures',   roles: ['administrateur'] },
    { label: 'Profils',         icon: 'fas fa-id-card',        route: '/profils',      roles: ['administrateur'] },
    { label: 'Employeurs',      icon: 'fas fa-briefcase',      route: '/employeurs',   roles: ['administrateur'] }
  ];

  private apiUrl      = 'http://localhost:8080/api/utilisateurs';
  private rolesApiUrl = 'http://localhost:8080/api/roles';

  constructor(
    private fb:          FormBuilder,
    private http:        HttpClient,
    private router:      Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      login:    ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleId:   ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.checkScreenSize();
    this.http.get<any[]>(this.rolesApiUrl).subscribe({
      next:  (data) => this.roles = data,
      error: ()     => this.errorMessage = 'Impossible de charger les rôles.'
    });
  }

  // ── Navbar ──────────────────────────────────────────
  @HostListener('window:resize')
  checkScreenSize() {
    if (window.innerWidth < 768) {
      this.isSidebarCollapsed = true;
      this.isMobileMenuOpen   = false;
    }
  }

  get visibleMenuItems() {
    return this.menuItems.filter(item =>
      item.roles.includes(this.user?.role ?? '')
    );
  }

  toggleSidebar():    void { this.isSidebarCollapsed = !this.isSidebarCollapsed; }
  toggleMobileMenu(): void { this.isMobileMenuOpen   = !this.isMobileMenuOpen; }
  toggleUserMenu():   void { this.isUserMenuOpen      = !this.isUserMenuOpen; }

  getPageTitle(): string {
    const currentRoute = this.router.url;
    const item = this.menuItems.find(i => currentRoute.includes(i.route));
    return item?.label || 'Tableau de bord';
  }

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

  // ── Formulaire ──────────────────────────────────────
  get login()    { return this.form.get('login'); }
  get password() { return this.form.get('password'); }
  get roleId()   { return this.form.get('roleId'); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading        = true;
    this.errorMessage   = '';
    this.successMessage = '';

    const payload = {
      login:    this.form.value.login,
      password: this.form.value.password,
      role:     { id: Number(this.form.value.roleId) }
    };

    this.http.post<any>(this.apiUrl, payload).subscribe({
      next: () => {
        this.loading        = false;
        this.successMessage = 'Compte utilisateur créé avec succès !';
        this.form.reset();
        setTimeout(() => this.router.navigate(['/utilisateurs']), 1500);
      },
      error: (err) => {
        this.loading      = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la création.';
      }
    });
  }

  onReset(): void {
    this.form.reset();
    this.successMessage = '';
    this.errorMessage   = '';
  }
}
