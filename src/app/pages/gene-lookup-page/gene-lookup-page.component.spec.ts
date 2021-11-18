import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneLookupPageComponent } from './gene-lookup-page.component';

describe('GeneLookupPageComponent', () => {
  let component: GeneLookupPageComponent;
  let fixture: ComponentFixture<GeneLookupPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneLookupPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneLookupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
