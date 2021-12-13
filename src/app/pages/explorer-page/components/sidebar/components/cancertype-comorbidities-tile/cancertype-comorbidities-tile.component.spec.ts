import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CancertypeComorbiditiesTileComponent } from './cancertype-comorbidities-tile.component';

describe('CancertypeComorbiditiesTileComponent', () => {
  let component: CancertypeComorbiditiesTileComponent;
  let fixture: ComponentFixture<CancertypeComorbiditiesTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CancertypeComorbiditiesTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CancertypeComorbiditiesTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
