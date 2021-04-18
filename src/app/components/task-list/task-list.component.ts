import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AnalysisService, algorithmNames} from '../../services/analysis/analysis.service';
import {Task} from '../../interfaces';


@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class TaskListComponent implements OnInit {

  @Input() token: string;
  // get task list NOT from analysis object but through @Input to trigger changeDetection on change of task list
  @Input() taskList: Task[] = [];
  @Output() tokenChange: EventEmitter<string> = new EventEmitter();

  public algorithmNames = algorithmNames;

  constructor(public analysis: AnalysisService) {
  }

  ngOnInit(): void {
  }

  public open(token) {
    this.token = token;
    this.tokenChange.emit(token);
  }

}
