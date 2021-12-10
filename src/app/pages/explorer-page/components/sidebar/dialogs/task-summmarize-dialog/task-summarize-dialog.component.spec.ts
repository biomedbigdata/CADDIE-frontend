import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskSummarizeDialogComponent } from './task-summarize-dialog.component';

describe('TaskSummarizeDialogComponent', () => {
  let component: TaskSummarizeDialogComponent;
  let fixture: ComponentFixture<TaskSummarizeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskSummarizeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskSummarizeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
