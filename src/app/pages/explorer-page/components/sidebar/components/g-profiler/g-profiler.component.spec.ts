import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GProfilerComponent } from './g-profiler.component';

describe('GProfilerComponent', () => {
  let component: GProfilerComponent;
  let fixture: ComponentFixture<GProfilerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GProfilerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GProfilerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
