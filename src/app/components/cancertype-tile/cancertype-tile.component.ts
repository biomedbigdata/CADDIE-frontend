import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CancerType} from '../../interfaces';

@Component({
  selector: 'app-cancertype-tile',
  templateUrl: './cancertype-tile.component.html',
  styleUrls: ['./cancertype-tile.component.scss']
})

export class CancertypeTileComponent implements OnInit {

  @Input() selectedCancerTypeItems: CancerType[];
  @Output() selectedCancerTypeItemsChange: EventEmitter<any> = new EventEmitter();

  @Input() cancerTypeItems: CancerType[];


  constructor() {

  }

  ngOnInit(): void {
  }

  public select(selectionItem) {

    this.selectedCancerTypeItems = [selectionItem];
    this.selectedCancerTypeItemsChange.emit(selectionItem);

  }

}
