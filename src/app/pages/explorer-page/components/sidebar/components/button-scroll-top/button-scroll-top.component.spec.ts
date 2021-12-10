import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonScrollTopComponent } from './button-scroll-top.component';

describe('ButtonScrollTopComponent', () => {
  let component: ButtonScrollTopComponent;
  let fixture: ComponentFixture<ButtonScrollTopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ButtonScrollTopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonScrollTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
