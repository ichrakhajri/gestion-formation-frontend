import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { SidebarMixin } from '../../../mixins/sidebar.mixin';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

interface ChartDefinition {
  key: string;
  label: string;
  icon: string;
  color: string;
}

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

  // Définition de tous les graphiques disponibles
  availableCharts: ChartDefinition[] = [
    { key: 'participantsAnnee',    label: 'Évolution des participants',  icon: 'fas fa-chart-bar',    color: '#3B82F6' },
    { key: 'formationsAnnee',      label: 'Formations par année',        icon: 'fas fa-calendar-alt', color: '#F97316' },
    { key: 'participantsStructure',label: 'Répartition par structure',   icon: 'fas fa-building',     color: '#22C55E' },
    { key: 'participantsProfil',   label: 'Répartition par profil',      icon: 'fas fa-id-card',      color: '#A855F7' },
    { key: 'budgetDomaine',        label: 'Budget par domaine',          icon: 'fas fa-chart-pie',    color: '#14B8A6' },
    { key: 'evolutionBudget',      label: 'Évolution du budget',         icon: 'fas fa-chart-line',   color: '#EF4444' },
    { key: 'topFormateurs',        label: 'Top 5 formateurs',            icon: 'fas fa-trophy',       color: '#EAB308' },
    { key: 'typeFormateurs',       label: 'Répartition formateurs',      icon: 'fas fa-chart-simple', color: '#6366F1' },
  ];

  // Ensemble des graphiques sélectionnés (aucun par défaut)
  selectedCharts: Set<string> = new Set();

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
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    super(authService, router);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadAllData();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  // ── Sélection des graphiques ─────────────────────────────────────────────

  toggleChart(key: string): void {
    if (this.selectedCharts.has(key)) {
      this.selectedCharts.delete(key);
      // Détruire uniquement ce graphique
      if (this.charts[key]) {
        this.charts[key]?.destroy();
        this.charts[key] = null;
      }
    } else {
      this.selectedCharts.add(key);
    }
    // Force re-render du DOM puis crée les graphiques manquants
    this.cdr.detectChanges();
    setTimeout(() => this.createMissingCharts(), 50);
  }

  selectAllCharts(): void {
    this.availableCharts.forEach(c => this.selectedCharts.add(c.key));
    this.cdr.detectChanges();
    setTimeout(() => this.createMissingCharts(), 50);
  }

  clearAllCharts(): void {
    this.destroyAllCharts();
    this.selectedCharts.clear();
  }

  isChartSelected(key: string): boolean {
    return this.selectedCharts.has(key);
  }

  // ── Chargement des données ───────────────────────────────────────────────

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

      this.calculateStats();
      this.extractAvailableYears();
      this.loading = false;
      this.dataLoaded = true;
      this.cdr.detectChanges();

      // Si des graphiques sont déjà sélectionnés (ex: rechargement), les recréer
      if (this.selectedCharts.size > 0) {
        setTimeout(() => this.createMissingCharts(), 200);
      }
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

  // ── Création des graphiques ──────────────────────────────────────────────

  /** Crée uniquement les graphiques sélectionnés qui n'existent pas encore */
  createMissingCharts(): void {
    if (!this.dataLoaded) return;

    const canvasMap: { [key: string]: ElementRef<HTMLCanvasElement> | undefined } = {
      participantsAnnee:     this.chartParticipantsAnnee,
      formationsAnnee:       this.chartFormationsAnnee,
      participantsStructure: this.chartParticipantsStructure,
      participantsProfil:    this.chartParticipantsProfil,
      budgetDomaine:         this.chartBudgetDomaine,
      evolutionBudget:       this.chartEvolutionBudget,
      topFormateurs:         this.chartTopFormateurs,
      typeFormateurs:        this.chartTypeFormateurs,
    };

    this.selectedCharts.forEach(key => {
      if (this.charts[key]) return; // déjà créé

      const ref = canvasMap[key];
      if (!ref?.nativeElement) return;

      switch (key) {
        case 'participantsAnnee':
          const d1 = this.getParticipantsParAnneeData();
          if (d1.labels.length) this.charts[key] = this.createBarChart(ref.nativeElement, d1, 'Nombre de participants');
          break;
        case 'formationsAnnee':
          const d2 = this.getFormationsParAnneeData();
          if (d2.labels.length) this.charts[key] = this.createBarChart(ref.nativeElement, d2, 'Nombre de formations');
          break;
        case 'participantsStructure':
          const d3 = this.getParticipantsParStructureData();
          if (d3.labels.length) this.charts[key] = this.createPieChart(ref.nativeElement, d3, 'Participants par structure');
          break;
        case 'participantsProfil':
          const d4 = this.getParticipantsParProfilData();
          if (d4.labels.length) this.charts[key] = this.createBarChart(ref.nativeElement, d4, 'Participants par profil');
          break;
        case 'budgetDomaine':
          const d5 = this.getBudgetParDomaineData();
          if (d5.labels.length) this.charts[key] = this.createPieChart(ref.nativeElement, d5, 'Budget par domaine (DT)');
          break;
        case 'evolutionBudget':
          const d6 = this.getEvolutionBudgetData();
          if (d6.labels.length) this.charts[key] = this.createLineChart(ref.nativeElement, d6, 'Évolution du budget (DT)');
          break;
        case 'topFormateurs':
          const d7 = this.getTopFormateursData();
          if (d7.labels.length) this.charts[key] = this.createBarChart(ref.nativeElement, d7, 'Nombre de formations');
          break;
        case 'typeFormateurs':
          const d8 = this.getTypeFormateursData();
          if (d8.labels.length) this.charts[key] = this.createPieChart(ref.nativeElement, d8, 'Répartition formateurs');
          break;
      }
    });
  }

  // ── Factories de graphiques ──────────────────────────────────────────────

  createBarChart(canvas: HTMLCanvasElement, data: { labels: string[], values: number[] }, label: string): Chart {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label,
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
          label,
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
          label,
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

  // ── Données des graphiques ───────────────────────────────────────────────

  getParticipantsParAnneeData(): { labels: string[], values: number[] } {
    const participantsByYear: { [key: number]: Set<number> } = {};
    this.formations.forEach(formation => {
      if (!participantsByYear[formation.annee]) participantsByYear[formation.annee] = new Set();
      formation.participants?.forEach((p: any) => participantsByYear[formation.annee].add(p.id));
    });
    const years = Object.keys(participantsByYear).sort();
    return { labels: years, values: years.map(y => participantsByYear[parseInt(y)].size) };
  }

  getFormationsParAnneeData(): { labels: string[], values: number[] } {
    const formationsByYear: { [key: number]: number } = {};
    this.formations.forEach(f => {
      formationsByYear[f.annee] = (formationsByYear[f.annee] || 0) + 1;
    });
    const years = Object.keys(formationsByYear).sort();
    return { labels: years, values: years.map(y => formationsByYear[parseInt(y)]) };
  }

  getParticipantsParStructureData(): { labels: string[], values: number[] } {
    const map: { [key: string]: number } = {};
    this.participants.forEach(p => {
      const lib = p.structure?.libelle || 'Non défini';
      map[lib] = (map[lib] || 0) + 1;
    });
    return { labels: Object.keys(map), values: Object.values(map) };
  }

  getParticipantsParProfilData(): { labels: string[], values: number[] } {
    const map: { [key: string]: number } = {};
    this.participants.forEach(p => {
      const lib = p.profil?.libelle || 'Non défini';
      map[lib] = (map[lib] || 0) + 1;
    });
    return { labels: Object.keys(map), values: Object.values(map) };
  }

  getBudgetParDomaineData(): { labels: string[], values: number[] } {
    const map: { [key: string]: number } = {};
    this.formations.forEach(f => {
      const lib = f.domaine?.libelle || 'Non défini';
      map[lib] = (map[lib] || 0) + (f.budget || 0);
    });
    return { labels: Object.keys(map), values: Object.values(map) };
  }

  getEvolutionBudgetData(): { labels: string[], values: number[] } {
    const map: { [key: number]: number } = {};
    this.formations.forEach(f => {
      map[f.annee] = (map[f.annee] || 0) + (f.budget || 0);
    });
    const years = Object.keys(map).sort();
    return { labels: years, values: years.map(y => map[parseInt(y)]) };
  }

  getTopFormateursData(): { labels: string[], values: number[] } {
    const map: { [key: string]: number } = {};
    this.formations.forEach(f => {
      if (f.formateur) {
        const nom = `${f.formateur.prenom} ${f.formateur.nom}`;
        map[nom] = (map[nom] || 0) + 1;
      }
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { labels: sorted.map(i => i[0]), values: sorted.map(i => i[1]) };
  }

  getTypeFormateursData(): { labels: string[], values: number[] } {
    let internes = 0, externes = 0;
    this.formateurs.forEach(f => {
      if (f.type === 'interne') internes++;
      else if (f.type === 'externe') externes++;
    });
    return { labels: ['Interne', 'Externe'], values: [internes, externes] };
  }

  // ── Utilitaires ──────────────────────────────────────────────────────────

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
    // Détruire et recréer tous les graphiques actifs avec les nouvelles données
    this.destroyAllCharts();
    setTimeout(() => this.createMissingCharts(), 100);
  }

  getFilteredFormations(): any[] {
    let filtered = this.formations;
    if (this.selectedYear !== 0) filtered = filtered.filter(f => f.annee === this.selectedYear);
    if (this.selectedStructure !== 'all') {
      filtered = filtered.filter(f =>
        f.participants?.some((p: any) => p.structure?.libelle === this.selectedStructure)
      );
    }
    if (this.selectedDomaine !== 'all') filtered = filtered.filter(f => f.domaine?.libelle === this.selectedDomaine);
    return filtered;
  }
}