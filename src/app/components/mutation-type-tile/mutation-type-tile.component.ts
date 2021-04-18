import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MutationCancerType} from '../../interfaces';

@Component({
  selector: 'app-mutation-type-tile',
  templateUrl: './mutation-type-tile.component.html',
  styleUrls: ['./mutation-type-tile.component.scss']
})

export class MutationTypeTileComponent implements OnInit {

  @Input() selectedCancerType: MutationCancerType;
  @Output() selectedCancerTypeChange: EventEmitter<any> = new EventEmitter();

  @Input() cancerTypes: MutationCancerType[];

  constructor() { }

  ngOnInit(): void {
  }

  public select(selectionItem) {
    this.selectedCancerType = selectionItem;
    this.selectedCancerTypeChange.emit(selectionItem);
  }


}
