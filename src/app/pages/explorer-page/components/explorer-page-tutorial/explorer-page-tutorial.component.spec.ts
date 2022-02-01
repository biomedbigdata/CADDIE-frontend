import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplorerPageTutorialComponent } from './explorer-page-tutorial.component';

describe('ExplorerPageTutorialComponent', () => {
  let component: ExplorerPageTutorialComponent;
  let fixture: ComponentFixture<ExplorerPageTutorialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExplorerPageTutorialComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorerPageTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
