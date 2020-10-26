import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Node, Wrapper, CancerNode} from '../../interfaces';

@Component({
  selector: 'app-query-tile-component',
  templateUrl: './query-tile.component.html',
  styleUrls: ['./query-tile.component.scss']
})
export class QueryTileComponent {

  @Output() selectItem: EventEmitter<any> = new EventEmitter();
  @Input() queryItems: Wrapper[];
  @Input() placeholder: string;
  @Input() removeOnSelect = false;

  constructor() {
  }

  querySearch = (term: string, item: Wrapper) => {
    term = term.toLowerCase();

    if (item.type === 'Node') {
      const data = item.data as Node;
      return data.name.toLowerCase().indexOf(term) > -1 ||
        data.backendId.toString().toLowerCase().indexOf(term) > -1 ||
        item.type.toLowerCase().indexOf(term) > -1 ||
        data.proteinName.toLocaleLowerCase().indexOf(term) > -1 ||
        data.uniprotAc.toLocaleLowerCase().indexOf(term) > -1 ;
    } else {
      // type is cancerNode
      const data = item.data as CancerNode;
      return data.name.toLowerCase().indexOf(term) > -1 ||
        data.type.toLowerCase().indexOf(term) > -1 ||
        item.type.toLowerCase().indexOf(term) > -1 ||
        data.backendId.toString().toLowerCase().indexOf(term) > -1 ||
        data.proteinName.toLocaleLowerCase().indexOf(term) > -1 ||
        data.uniprotAc.toLocaleLowerCase().indexOf(term) > -1 ;
    }
  }


  select(item) {
    this.selectItem.emit(item);
    if (this.removeOnSelect) {
      let newObj = this.queryItems;
      this.queryItems.forEach((wrapper: Wrapper, index, object) => {
        if (wrapper.backendId.toString() === item.data.backendId.toString()) {
          // remove item
          object.splice(index, 1);
          newObj = object;
        }
      });

      this.queryItems = [...newObj];

    }

  }

}
