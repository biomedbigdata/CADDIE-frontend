import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CancernetPanelComponent } from './cancernet-panel.component';

describe('CancernetPanelComponent', () => {
  let component: CancernetPanelComponent;
  let fixture: ComponentFixture<CancernetPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CancernetPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CancernetPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
