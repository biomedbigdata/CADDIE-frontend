import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MutationTypeTileComponent } from './mutation-type-tile.component';

describe('MutationTypeTileComponent', () => {
  let component: MutationTypeTileComponent;
  let fixture: ComponentFixture<MutationTypeTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MutationTypeTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MutationTypeTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
