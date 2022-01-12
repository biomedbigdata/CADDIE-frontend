import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PythonPageComponent } from './python-page.component';

describe('PythonPageComponent', () => {
  let component: PythonPageComponent;
  let fixture: ComponentFixture<PythonPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PythonPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PythonPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
