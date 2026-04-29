import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomaineListComponent } from './domaine-list.component';

describe('DomaineListComponent', () => {
  let component: DomaineListComponent;
  let fixture: ComponentFixture<DomaineListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomaineListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DomaineListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
