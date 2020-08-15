import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-data-level-toggle',
  templateUrl: './data-level-toggle.component.html',
  styleUrls: ['./data-level-toggle.component.scss']
})
export class DataLevelToggleComponent implements OnInit {

  @Input() iconGene = 'fa-times';
  @Input() iconProtein = 'fa-check';

  @Input() textGene: string;
  @Input() textProtein: string;

  @Input() tooltipGene: string;
  @Input() tooltipProtein: string;

  @Input() value: boolean;
  @Output() valueChange = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {
  }

  public toggle(value: boolean, level:string) {
    this.value = value;
    console.log(level)
    console.log(value)
    this.valueChange.emit(level);
  }

}
