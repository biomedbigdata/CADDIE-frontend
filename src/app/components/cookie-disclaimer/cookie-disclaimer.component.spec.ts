import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CookieDisclaimerComponent } from './cookie-disclaimer.component';

describe('CookieDisclaimerComponent', () => {
  let component: CookieDisclaimerComponent;
  let fixture: ComponentFixture<CookieDisclaimerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CookieDisclaimerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CookieDisclaimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
