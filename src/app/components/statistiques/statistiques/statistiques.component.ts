import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { SidebarMixin } from '../../../mixins/sidebar.mixin';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './statistiques.component.html',
  styleUrl: './statistiques.component.scss'
})
export class StatistiquesComponent extends SidebarMixin implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartParticipantsAnnee') chartParticipantsAnnee!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartFormationsAnnee') chartFormationsAnnee!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartParticipantsStructure') chartParticipantsStructure!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartParticipantsProfil') chartParticipantsProfil!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartBudgetDomaine') chartBudgetDomaine!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEvolutionBudget') chartEvolutionBudget!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartTopFormateurs') chartTopFormateurs!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartTypeFormateurs') chartTypeFormateurs!: ElementRef<HTMLCanvasElement>;

  // Données principales
  formations: any[] = [];
  participants: any[] = [];
  formateurs: any[] = [];
  structures: any[] = [];
  domaines: any[] = [];
  profils: any[] = [];

  // Indicateurs clés
  totalFormations = 0;
  totalParticipants = 0;
  totalFormateurs = 0;
  budgetTotal = 0;
  tauxRemplissage = 0;
  dureeMoyenne = 0;

  // Filtres
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];
  selectedStructure: string = 'all';
  selectedDomaine: string = 'all';

  loading = true;
  dataLoaded = false;
  errorMessage = '';

  private charts: { [key: string]: Chart | null } = {
    participantsAnnee: null,
    formationsAnnee: null,
    participantsStructure: null,
    participantsProfil: null,
    budgetDomaine: null,
    evolutionBudget: null,
    topFormateurs: null,
    typeFormateurs: null
  };

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    authService: AuthService,
    router: Router,
    private http: HttpClient
  ) {
    super(authService, router);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    // Attendre que les données soient chargées
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  loadAllData(): void {
    this.loading = true;
    Promise.all([
      this.http.get<any[]>(`${this.apiUrl}/formations`).toPromise(),
      this.http.get<any[]>(`${this.apiUrl}/participants`).toPromise(),
      this.http.get<any[]>(`${this.apiUrl}/formateurs`).toPromise(),
      this.http.get<any[]>(`${this.apiUrl}/structures`).toPromise(),
      this.http.get<any[]>(`${this.apiUrl}/domaines`).toPromise(),
      this.http.get<any[]>(`${this.apiUrl}/profils`).toPromise()
    ]).then(([formations, participants, formateurs, structures, domaines, profils]) => {
      this.formations = formations || [];
      this.participants = participants || [];
      this.formateurs = formateurs || [];
      this.structures = structures || [];
      this.domaines = domaines || [];
      this.profils = profils || [];

      console.log('Données chargées:', {
        formations: this.formations.length,
        participants: this.participants.length,
        formateurs: this.formateurs.length
      });

      this.calculateStats();
      this.extractAvailableYears();
      this.loading = false;
      this.dataLoaded = true;

      setTimeout(() => {
        this.createAllCharts();
      }, 200);
    }).catch(error => {
      console.error('Erreur chargement données:', error);
      this.loading = false;
      this.errorMessage = 'Erreur lors du chargement des données';
    });
  }

  calculateStats(): void {
    this.totalFormations = this.formations.length;
    this.totalParticipants = this.participants.length;
    this.totalFormateurs = this.formateurs.length;
    this.budgetTotal = this.formations.reduce((sum, f) => sum + (f.budget || 0), 0);

    const totalDuree = this.formations.reduce((sum, f) => sum + (f.duree || 0), 0);
    this.dureeMoyenne = this.totalFormations > 0 ? totalDuree / this.totalFormations : 0;

    const capaciteMoyenne = 20;
    const totalPlaces = this.totalFormations * capaciteMoyenne;
    const totalInscrits = this.formations.reduce((sum, f) => sum + (f.participants?.length || 0), 0);
    this.tauxRemplissage = totalPlaces > 0 ? (totalInscrits / totalPlaces) * 100 : 0;
  }

  extractAvailableYears(): void {
    const years = new Set<number>();
    this.formations.forEach(f => {
      if (f.annee) years.add(f.annee);
    });
    this.availableYears = Array.from(years).sort((a, b) => b - a);
    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }
  }

  createAllCharts(): void {
    if (!this.dataLoaded) {
      console.log('Données non chargées, attente...');
      return;
    }

    console.log('Création des graphiques...');
    this.destroyAllCharts();

    if (!this.chartParticipantsAnnee?.nativeElement) {
      console.error('Éléments canvas non trouvés');
      return;
    }

    // Graphique 1: Participants par année
    const data1 = this.getParticipantsParAnneeData();
    if (data1.labels.length > 0) {
      this.charts['participantsAnnee'] = this.createBarChart(
        this.chartParticipantsAnnee.nativeElement,
        data1,
        'Nombre de participants'
      );
    }

    // Graphique 2: Formations par année
    const data2 = this.getFormationsParAnneeData();
    if (data2.labels.length > 0) {
      this.charts['formationsAnnee'] = this.createBarChart(
        this.chartFormationsAnnee.nativeElement,
        data2,
        'Nombre de formations'
      );
    }

    // Graphique 3: Participants par structure
    const data3 = this.getParticipantsParStructureData();
    if (data3.labels.length > 0) {
      this.charts['participantsStructure'] = this.createPieChart(
        this.chartParticipantsStructure.nativeElement,
        data3,
        'Participants par structure'
      );
    }

    // Graphique 4: Participants par profil
    const data4 = this.getParticipantsParProfilData();
    if (data4.labels.length > 0) {
      this.charts['participantsProfil'] = this.createBarChart(
        this.chartParticipantsProfil.nativeElement,
        data4,
        'Participants par profil'
      );
    }

    // Graphique 5: Budget par domaine
    const data5 = this.getBudgetParDomaineData();
    if (data5.labels.length > 0) {
      this.charts['budgetDomaine'] = this.createPieChart(
        this.chartBudgetDomaine.nativeElement,
        data5,
        'Budget par domaine (DT)'
      );
    }

    // Graphique 6: Évolution budget
    const data6 = this.getEvolutionBudgetData();
    if (data6.labels.length > 0) {
      this.charts['evolutionBudget'] = this.createLineChart(
        this.chartEvolutionBudget.nativeElement,
        data6,
        'Évolution du budget (DT)'
      );
    }

    // Graphique 7: Top formateurs
    const data7 = this.getTopFormateursData();
    if (data7.labels.length > 0) {
      this.charts['topFormateurs'] = this.createBarChart(
        this.chartTopFormateurs.nativeElement,
        data7,
        'Nombre de formations'
      );
    }

    // Graphique 8: Type formateurs
    const data8 = this.getTypeFormateursData();
    if (data8.labels.length > 0) {
      this.charts['typeFormateurs'] = this.createPieChart(
        this.chartTypeFormateurs.nativeElement,
        data8,
        'Répartition formateurs'
      );
    }

    console.log('Graphiques créés avec succès');
  }

  createBarChart(canvas: HTMLCanvasElement, data: { labels: string[], values: number[] }, label: string): Chart {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: label,
          data: data.values,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  createPieChart(canvas: HTMLCanvasElement, data: { labels: string[], values: number[] }, label: string): Chart {
    const colors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)'
    ];

    return new Chart(canvas, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [{
          label: label,
          data: data.values,
          backgroundColor: colors.slice(0, data.labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
      }
    });
  }

  createLineChart(canvas: HTMLCanvasElement, data: { labels: string[], values: number[] }, label: string): Chart {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: label,
          data: data.values,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  destroyAllCharts(): void {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key]?.destroy();
        this.charts[key] = null;
      }
    });
  }

  // Méthodes de données
  getParticipantsParAnneeData(): { labels: string[], values: number[] } {
    const participantsByYear: { [key: number]: Set<number> } = {};

    this.formations.forEach(formation => {
      if (!participantsByYear[formation.annee]) {
        participantsByYear[formation.annee] = new Set();
      }
      formation.participants?.forEach((p: any) => {
        participantsByYear[formation.annee].add(p.id);
      });
    });

    const years = Object.keys(participantsByYear).sort();
    return {
      labels: years,
      values: years.map(year => participantsByYear[parseInt(year)].size)
    };
  }

  getFormationsParAnneeData(): { labels: string[], values: number[] } {
    const formationsByYear: { [key: number]: number } = {};

    this.formations.forEach(formation => {
      formationsByYear[formation.annee] = (formationsByYear[formation.annee] || 0) + 1;
    });

    const years = Object.keys(formationsByYear).sort();
    return {
      labels: years,
      values: years.map(year => formationsByYear[parseInt(year)])
    };
  }

  getParticipantsParStructureData(): { labels: string[], values: number[] } {
    const participantsByStructure: { [key: string]: number } = {};

    this.participants.forEach(participant => {
      const structureLib = participant.structure?.libelle || 'Non défini';
      participantsByStructure[structureLib] = (participantsByStructure[structureLib] || 0) + 1;
    });

    return {
      labels: Object.keys(participantsByStructure),
      values: Object.values(participantsByStructure)
    };
  }

  getParticipantsParProfilData(): { labels: string[], values: number[] } {
    const participantsByProfil: { [key: string]: number } = {};

    this.participants.forEach(participant => {
      const profilLib = participant.profil?.libelle || 'Non défini';
      participantsByProfil[profilLib] = (participantsByProfil[profilLib] || 0) + 1;
    });

    return {
      labels: Object.keys(participantsByProfil),
      values: Object.values(participantsByProfil)
    };
  }

  getBudgetParDomaineData(): { labels: string[], values: number[] } {
    const budgetByDomaine: { [key: string]: number } = {};

    this.formations.forEach(formation => {
      const domaineLib = formation.domaine?.libelle || 'Non défini';
      budgetByDomaine[domaineLib] = (budgetByDomaine[domaineLib] || 0) + (formation.budget || 0);
    });

    return {
      labels: Object.keys(budgetByDomaine),
      values: Object.values(budgetByDomaine)
    };
  }

  getEvolutionBudgetData(): { labels: string[], values: number[] } {
    const budgetByYear: { [key: number]: number } = {};

    this.formations.forEach(formation => {
      budgetByYear[formation.annee] = (budgetByYear[formation.annee] || 0) + (formation.budget || 0);
    });

    const years = Object.keys(budgetByYear).sort();
    return {
      labels: years,
      values: years.map(year => budgetByYear[parseInt(year)])
    };
  }

  getTopFormateursData(): { labels: string[], values: number[] } {
    const formationsByFormateur: { [key: string]: number } = {};

    this.formations.forEach(formation => {
      if (formation.formateur) {
        const nom = `${formation.formateur.prenom} ${formation.formateur.nom}`;
        formationsByFormateur[nom] = (formationsByFormateur[nom] || 0) + 1;
      }
    });

    const sorted = Object.entries(formationsByFormateur)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sorted.map(item => item[0]),
      values: sorted.map(item => item[1])
    };
  }

  getTypeFormateursData(): { labels: string[], values: number[] } {
    let internes = 0;
    let externes = 0;

    this.formateurs.forEach(formateur => {
      if (formateur.type === 'interne') internes++;
      else if (formateur.type === 'externe') externes++;
    });

    return {
      labels: ['Interne', 'Externe'],
      values: [internes, externes]
    };
  }

  // Méthodes utilitaires
  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value) + ' DT';
  }

  refreshData(): void {
    this.destroyAllCharts();
    this.loadAllData();
  }

  onYearChange(): void {
    setTimeout(() => {
      this.createAllCharts();
    }, 100);
  }

  getFilteredFormations(): any[] {
    let filtered = this.formations;
    if (this.selectedYear !== 0) {
      filtered = filtered.filter(f => f.annee === this.selectedYear);
    }
    if (this.selectedStructure !== 'all') {
      filtered = filtered.filter(f =>
        f.participants?.some((p: any) => p.structure?.libelle === this.selectedStructure)
      );
    }
    if (this.selectedDomaine !== 'all') {
      filtered = filtered.filter(f => f.domaine?.libelle === this.selectedDomaine);
    }
    return filtered;
  }
}
