import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';


@Component({
  selector: 'app-accueil',
    standalone: true,
      imports: [CommonModule, RouterModule,RouterLink, RouterLinkActive],

styleUrls: ['./accueil.component.scss'],

  templateUrl: './accueil.component.html'
})
export class AccueilComponent {

  stats = [
    { value: '+500', label: 'Participants formés' },
    { value: '24',   label: 'Formations / an' },
    { value: '18',   label: 'Formateurs experts' },
    { value: '8',    label: 'Domaines couverts' },
    { value: '98%',  label: 'Satisfaction' }
  ];

  features = [
    { icon: 'fa-star',        color: '#1D9E75', bg: '#E1F5EE', iconColor: '#085041',
      title: 'Expertise reconnue',
      desc: 'Formateurs certifiés avec une expérience terrain dans chaque domaine.' },
    { icon: 'fa-clock',       color: '#1D9E75', bg: '#E1F5EE', iconColor: '#085041',
      title: 'Planning structuré',
      desc: 'Calendrier annuel planifié selon les besoins de chaque structure.' },
    { icon: 'fa-users',       color: '#1D9E75', bg: '#E1F5EE', iconColor: '#085041',
      title: 'Suivi personnalisé',
      desc: 'Suivi individuel et évaluation en fin de chaque formation.' },
    { icon: 'fa-desktop',     color: '#BA7517', bg: '#FAEEDA', iconColor: '#633806',
      title: 'Formations multi-domaines',
      desc: 'Informatique, finance, mécanique, management et bien plus.' },
    { icon: 'fa-file-alt',    color: '#534AB7', bg: '#EEEDFE', iconColor: '#3C3489',
      title: 'Attestations officielles',
      desc: 'Chaque formation validée donne droit à une attestation reconnue.' },
    { icon: 'fa-chart-bar',   color: '#D85A30', bg: '#FAECE7', iconColor: '#712B13',
      title: 'Statistiques détaillées',
      desc: 'Tableaux de bord pour évaluer l\'impact par structure et domaine.' }
  ];

  domaines = [
    { tag: 'Informatique', bg: '#0f6e56', icon: 'fa-desktop',   iconColor: '#9FE1CB',
      tagBg: '#E1F5EE', tagColor: '#085041',
      title: 'Cybersécurité & Systèmes d\'information',
      desc: 'Maîtrisez les fondamentaux de la sécurité informatique.',
      duree: '5 jours', public: 'Informaticiens' },
    { tag: 'Finance', bg: '#854F0B', icon: 'fa-chart-pie',      iconColor: '#FAC775',
      tagBg: '#FAEEDA', tagColor: '#633806',
      title: 'Comptabilité & Gestion budgétaire',
      desc: 'Outils modernes de gestion financière et d\'analyse budgétaire.',
      duree: '3 jours', public: 'Gestionnaires' },
    { tag: 'Management', bg: '#3C3489', icon: 'fa-project-diagram', iconColor: '#AFA9EC',
      tagBg: '#EEEDFE', tagColor: '#3C3489',
      title: 'Leadership & Gestion de projet Agile',
      desc: 'Compétences managériales et méthodes agiles.',
      duree: '4 jours', public: 'Cadres' },
    { tag: 'Mécanique', bg: '#993C1D', icon: 'fa-tools',        iconColor: '#F0997B',
      tagBg: '#FAECE7', tagColor: '#712B13',
      title: 'Maintenance industrielle & Sécurité',
      desc: 'Techniques de maintenance préventive et corrective.',
      duree: '2 jours', public: 'Techniciens' }
  ];

  services = [
    { icon: 'fa-file-contract', bg: '#E1F5EE', color: '#085041',
      title: 'Consulter les formations',
      desc: 'Accédez au calendrier des sessions et inscrivez-vous facilement.' },
    { icon: 'fa-users',         bg: '#FAEEDA', color: '#633806',
      title: 'Gérer les participants',
      desc: 'Ajoutez et suivez les participants de votre structure.' },
    { icon: 'fa-chart-bar',     bg: '#EEEDFE', color: '#3C3489',
      title: 'Voir les statistiques',
      desc: 'Consultez les rapports d\'activité par domaine et structure.' }
  ];
}
