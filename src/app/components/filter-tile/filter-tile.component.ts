import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CancerNode, DataLevel, Wrapper} from "../../interfaces";

@Component({
  selector: 'app-filter-tile',
  templateUrl: './filter-tile.component.html',
  styleUrls: ['./filter-tile.component.scss']
})
export class FilterTileComponent implements OnInit {

  @Output() selectItem = new EventEmitter<any>();
  @Input() checkboxes: Array<{ checked: boolean; data: CancerNode }>;

  constructor() { }

  ngOnInit(): void {
  }

  filterFun(): void {
    this.selectItem.emit()
  }

}
