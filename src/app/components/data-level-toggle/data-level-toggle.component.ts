import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-data-level-toggle',
  templateUrl: './data-level-toggle.component.html',
  styleUrls: ['./data-level-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataLevelToggleComponent implements OnInit {

  @Input() iconGene = 'fa-dna';
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

  public toggle(value: boolean, level: string) {
    this.value = value;
    this.valueChange.emit(level);
  }

}
