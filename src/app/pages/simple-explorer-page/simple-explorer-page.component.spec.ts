import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleExplorerPageComponent } from './simple-explorer-page.component';

describe('SimpleExplorerPageComponent', () => {
  let component: SimpleExplorerPageComponent;
  let fixture: ComponentFixture<SimpleExplorerPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SimpleExplorerPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleExplorerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
