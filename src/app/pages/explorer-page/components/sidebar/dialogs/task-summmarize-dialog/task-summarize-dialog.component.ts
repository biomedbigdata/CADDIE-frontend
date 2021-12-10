import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AnalysisService, algorithmNames} from '../../../../../../services/analysis/analysis.service';
import {Task} from '../../../../../../interfaces';
import { ControlService } from 'src/app/services/control/control.service';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';

@Component({
  selector: 'app-task-summarize-dialog',
  templateUrl: './task-summarize-dialog.component.html',
  styleUrls: ['./task-summarize-dialog.component.scss']
})
export class TaskSummarizeDialogComponent implements OnInit {

  @Input() token: string;
  // get task list NOT from analysis object but through @Input to trigger changeDetection on change of task list
  @Input() taskList: Task[] = [];
  @Output() tokenChange: EventEmitter<string> = new EventEmitter();

  public algorithmNames = algorithmNames;
  public taskCheckboxes = new Set();
  public showSummaryOptions = false;

  constructor(public analysis: AnalysisService, private control: ControlService, public explorerData: ExplorerDataService) {
  }

  ngOnInit(): void {
  }

  public open(token) {
    this.token = token;
    this.tokenChange.emit(token);
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
    const response = await this.control.postTaskSummmarize({sourceTasks: [...this.taskCheckboxes]});
    const tokenKey = 'token';
    this.analysis.addTask(response[tokenKey]);
  }

  public close() {
    this.explorerData.showTaskSummarizeDialog = false;
  }

}