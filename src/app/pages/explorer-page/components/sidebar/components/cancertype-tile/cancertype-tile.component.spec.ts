import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CancertypeTileComponent } from './cancertype-tile.component';

describe('CancertypeTileComponent', () => {
  let component: CancertypeTileComponent;
  let fixture: ComponentFixture<CancertypeTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CancertypeTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CancertypeTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
