import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { FormationListComponent } from './components/formations/formation-list/formation-list.component';
import { FormateurListComponent } from './components/formateurs/formateur-list/formateur-list.component';
import { ParticipantListComponent } from './components/participants/participant-list/participant-list.component';
import { StatistiquesComponent } from './components/statistiques/statistiques/statistiques.component';
import { AccueilComponent } from './components/accueil/accueil.component';
import { AboutComponent } from './components/about/about.component';

export const routes: Routes = [
  { path: '', component: AccueilComponent },  // Page d'accueil publique
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'formations', component: FormationListComponent, canActivate: [authGuard] },
  { path: 'formateurs', component: FormateurListComponent, canActivate: [authGuard] },
  { path: 'participants', component: ParticipantListComponent, canActivate: [authGuard] },
  { path: 'statistiques', component: StatistiquesComponent, canActivate: [authGuard] },
  { path: 'about', component: AboutComponent },  // Si vous avez une page À propos dédiée
  { path: 'contact', component: AboutComponent }, // Si vous avez une page Contact dédiée
  { path: '**', redirectTo: '' }  // Redirige toutes les routes inconnues vers l'accueil
];
