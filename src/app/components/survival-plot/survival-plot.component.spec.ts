import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SurvivalPlotComponent } from './survival-plot.component';

describe('SurvivalPlotComponent', () => {
  let component: SurvivalPlotComponent;
  let fixture: ComponentFixture<SurvivalPlotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SurvivalPlotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SurvivalPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
