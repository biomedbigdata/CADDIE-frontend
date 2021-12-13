import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LaunchAnalysisCategoryDropdownComponent } from './launch-analysis-category-dropdown.component';

describe('LaunchAnalysisCategoryDropdownComponent', () => {
  let component: LaunchAnalysisCategoryDropdownComponent;
  let fixture: ComponentFixture<LaunchAnalysisCategoryDropdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LaunchAnalysisCategoryDropdownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LaunchAnalysisCategoryDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
