import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { AccueilComponent }          from './components/accueil/accueil.component';
import { LoginComponent }            from './components/login/login.component';
import { AboutComponent }            from './components/about/about.component';
import { DashboardComponent }        from './components/dashboard/dashboard.component';
import { FormationListComponent }    from './components/formations/formation-list/formation-list.component';
import { FormateurListComponent }    from './components/formateurs/formateur-list/formateur-list.component';
import { ParticipantListComponent }  from './components/participants/participant-list/participant-list.component';
import { StatistiquesComponent }     from './components/statistiques/statistiques/statistiques.component';
import { AddUtilisateurComponent }   from './components/add-utilisateur/add-utilisateur.component';
import { UtilisateurListComponent }  from './components/utilisateurs/utilisateur-list/utilisateur-list.component';
import { DomaineListComponent }      from './components/domaines/domaine-list/domaine-list.component';
import { StructureListComponent }    from './components/structures/structure-list/structure-list.component';
import { ProfilListComponent }       from './components/profils/profil-list/profil-list.component';
import { EmployeurListComponent }    from './components/employeurs/employeur-list/employeur-list.component';

export const routes: Routes = [
  { path: '',             component: AccueilComponent },
  { path: 'login',        component: LoginComponent },
  { path: 'about',        component: AboutComponent },
  { path: 'contact',      component: AboutComponent },

  { path: 'dashboard',        component: DashboardComponent,       canActivate: [authGuard] },
  { path: 'formations',       component: FormationListComponent,    canActivate: [authGuard] },
  { path: 'formateurs',       component: FormateurListComponent,    canActivate: [authGuard] },
  { path: 'participants',     component: ParticipantListComponent,  canActivate: [authGuard] },
  { path: 'statistiques',     component: StatistiquesComponent,     canActivate: [authGuard] },
  
  { path: 'utilisateurs',     component: UtilisateurListComponent,  canActivate: [authGuard] },
  { path: 'utilisateurs/add', component: AddUtilisateurComponent,   canActivate: [authGuard] },
  { path: 'domaines',         component: DomaineListComponent,      canActivate: [authGuard] },
  { path: 'structures',       component: StructureListComponent,    canActivate: [authGuard] },
  { path: 'profils',          component: ProfilListComponent,       canActivate: [authGuard] },
  { path: 'employeurs',       component: EmployeurListComponent,    canActivate: [authGuard] },

  { path: '**', redirectTo: '' }
];
