import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-analysis-parameters-window',
  templateUrl: './analysis-parameters-window.component.html',
  styleUrls: ['./analysis-parameters-window.component.scss']
})
export class AnalysisParametersWindowComponent implements OnInit {

  @Input() wrapper: any;

  constructor() { }

  ngOnInit(): void {
  }

}
