import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Node, Wrapper, CancerNode, DataLevel} from '../../interfaces';

@Component({
  selector: 'app-query-tile-component',
  templateUrl: './query-tile.component.html',
  styleUrls: ['./query-tile.component.scss']
})
export class QueryTileComponent {

  @Output() selectItem: EventEmitter<any> = new EventEmitter();
  @Input() queryItems: Wrapper[];
  @Input() dataLevel: DataLevel;
  @Input() placeholder: string;

  querySearch = (term: string, item: Wrapper) => {
    term = term.toLowerCase();
    console.log(item)
    console.log(this.dataLevel)
    if (this.dataLevel == 'gene') {
      if (item.type === 'node') {
        const data = item.data as Node;
        return data.name.toLowerCase().indexOf(term) > -1 ||
          data.backendId.toString().toLowerCase().indexOf(term) > -1 ||
          item.type.toLowerCase().indexOf(term) > -1;
      } else {
        // type is cancerNode
        const data = item.data as CancerNode;
        return data.name.toLowerCase().indexOf(term) > -1 ||
          data.type.toLowerCase().indexOf(term) > -1 ||
          item.type.toLowerCase().indexOf(term) > -1 ||
          data.backendId.toString().toLowerCase().indexOf(term) > -1;
      }
    } else if (this.dataLevel == 'protein') {
      if (item.type === 'node') {
        const data = item.data as Node;
        return data.name.toLowerCase().indexOf(term) > -1 ||
          data.backendId.toString().toLowerCase().indexOf(term) > -1 ||
          item.type.toLowerCase().indexOf(term) > -1 ||
          data.proteinName.toString().toLowerCase().indexOf(term) > -1
      } else {
        // type is cancerNode
        const data = item.data as CancerNode;
        return data.name.toLowerCase().indexOf(term) > -1 ||
          data.type.toLowerCase().indexOf(term) > -1 ||
          item.type.toLowerCase().indexOf(term) > -1 ||
          data.backendId.toString().toLowerCase().indexOf(term) > -1;
      }
    }

  }

  select(item) {
    this.selectItem.emit(item);
  }

}
