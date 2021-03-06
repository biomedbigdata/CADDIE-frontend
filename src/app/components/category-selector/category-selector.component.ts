import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BackendObject} from '../../interfaces';


@Component({
  selector: 'app-category-selector',
  templateUrl: './category-selector.component.html',
  styleUrls: ['./category-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySelectorComponent implements OnInit {

  @Input() expanded: boolean;
  @Input() label: string;
  @Input() selectedElement: BackendObject;
  @Input() elements: BackendObject[];
  @Output() callbackFun = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

  onSelect(expressionCancerType: BackendObject | null) {
    // close pop out
    this.expanded = !this.expanded;

    this.selectedElement = expressionCancerType;
    this.callbackFun.emit(expressionCancerType);
  }

}
