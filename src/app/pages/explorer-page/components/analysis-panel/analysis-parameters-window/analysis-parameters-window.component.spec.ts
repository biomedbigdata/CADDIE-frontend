import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisParametersWindowComponent } from './analysis-parameters-window.component';

describe('AnalysisParametersWindowComponent', () => {
  let component: AnalysisParametersWindowComponent;
  let fixture: ComponentFixture<AnalysisParametersWindowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisParametersWindowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisParametersWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
