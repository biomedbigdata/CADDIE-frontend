import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataLevelToggleComponent } from './data-level-toggle.component';

describe('DataLevelToggleComponent', () => {
  let component: DataLevelToggleComponent;
  let fixture: ComponentFixture<DataLevelToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataLevelToggleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataLevelToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
