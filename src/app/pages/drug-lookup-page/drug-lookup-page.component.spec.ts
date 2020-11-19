import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugLookupPageComponent } from './drug-lookup-page.component';

describe('DrugLookupPageComponent', () => {
  let component: DrugLookupPageComponent;
  let fixture: ComponentFixture<DrugLookupPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DrugLookupPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrugLookupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
