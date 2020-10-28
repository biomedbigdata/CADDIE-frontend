import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiseaseRelatedGenesComponent } from './disease-related-genes.component';

describe('DiseaseRelatedGenesComponent', () => {
  let component: DiseaseRelatedGenesComponent;
  let fixture: ComponentFixture<DiseaseRelatedGenesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiseaseRelatedGenesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiseaseRelatedGenesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
