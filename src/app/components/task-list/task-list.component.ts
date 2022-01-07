import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AnalysisService, algorithmNames} from '../../services/analysis/analysis.service';
import {Task} from '../../interfaces';
import { ControlService } from 'src/app/services/control/control.service';
import { toast } from 'bulma-toast';


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
  public taskCheckboxes = new Set();
  public showSummaryOptions = false;

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
    this.toggleSummaryOptions();
  }

  public addToTaskSelection(event, token: string) {
    if (event.target.checked) {
      // add to selection
      this.taskCheckboxes.add(token);
    } else {
      // remove from selection
      this.taskCheckboxes.delete(token);
    }
  }

  public async startSummmaryTask() {
    if ([...this.taskCheckboxes].length < 2) {
      toast({
        message: 'Please select 2 or more tasks to summarize.',
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
        type: 'is-danger',
        position: 'top-center',
        animate: { in: 'fadeIn', out: 'fadeOut' }
      });
      return
    }
    const response = await this.control.postTaskSummmarize({sourceTasks: [...this.taskCheckboxes]});
    const tokenKey = 'token';
    this.analysis.addTask(response[tokenKey]);
  }

  public toggleSummaryOptions() {
    this.showSummaryOptions = !this.showSummaryOptions;
  }

}
