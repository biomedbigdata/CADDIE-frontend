import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AnalysisService, algorithmNames} from '../../services/analysis/analysis.service';
import {Task} from '../../interfaces';
import { ControlService } from 'src/app/services/control/control.service';


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
  public taskSelection = [];

  constructor(public analysis: AnalysisService, private control: ControlService) {
  }

  ngOnInit(): void {
  }

  public open(token) {
    this.token = token;
    this.tokenChange.emit(token);
  }

  public toggleCheckboxes() {
    document.getElementById('task-list').classList.toggle('task-list-checkbox-hidden');
  }

  public addToTaskSelection(event, token: string) {
    if (event.target.checked) {
      // add to selection
      this.taskSelection.push(token);
    } else {
      // remove from selection
      this.taskSelection = this.taskSelection.filter(e => e !== token);
    }
  }

  public async startSummmaryTask() {
    const response = await this.control.postTaskSummmarize({'sourceTasks': this.taskSelection})
    this.analysis.addTask(response['token']);
  }

}
