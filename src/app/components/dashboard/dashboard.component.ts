import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user: User | null = null;

  // Each menu item has a roles array — only shown to those roles
  menuItems = [
    { label: 'Formations',   icon: '🎓', route: '/formations',   roles: ['administrateur', 'simple utilisateur', 'responsable'] },
    { label: 'Participants', icon: '👥', route: '/participants',  roles: ['administrateur', 'simple utilisateur'] },
    { label: 'Formateurs',   icon: '🧑‍🏫', route: '/formateurs',  roles: ['administrateur', 'simple utilisateur'] },
    { label: 'Statistiques', icon: '📊', route: '/stats',         roles: ['administrateur', 'responsable'] },
    { label: 'Utilisateurs', icon: '🔐', route: '/utilisateurs',  roles: ['administrateur'] },
    { label: 'Domaines',     icon: '🗂️', route: '/domaines',     roles: ['administrateur'] },
    { label: 'Structures',   icon: '🏢', route: '/structures',    roles: ['administrateur'] },
    { label: 'Profils',      icon: '📋', route: '/profils',       roles: ['administrateur'] },
    { label: 'Employeurs',   icon: '🏭', route: '/employeurs',    roles: ['administrateur'] },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
  }

  get visibleMenuItems() {
    return this.menuItems.filter(item =>
      item.roles.includes(this.user?.role ?? '')
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
