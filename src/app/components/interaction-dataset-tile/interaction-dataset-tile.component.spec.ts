import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionDatasetTileComponent } from './interaction-dataset-tile.component';

describe('InteractionDatasetTileComponent', () => {
  let component: InteractionDatasetTileComponent;
  let fixture: ComponentFixture<InteractionDatasetTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractionDatasetTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionDatasetTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
