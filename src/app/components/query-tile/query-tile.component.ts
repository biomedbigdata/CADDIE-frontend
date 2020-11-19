import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Wrapper} from '../../interfaces';

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
    // convert string to lowercase as later all attributes
    if (term === undefined) {
      return false
    }
    term = term.toLowerCase();
    const data = item.data;

    // check if string occurs in any of the attributes
    // we always need to check if attribute is set, otherwise we will get a type error
    const testType = item.type ? item.type.toLowerCase().indexOf(term) > -1 : false;
    const testName = data.name ? data.name.toLowerCase().indexOf(term) > -1 : false;
    const testEntrez = data.entrezId ? data.entrezId.toString().toLowerCase().indexOf(term) > -1 : false;
    const testProteinName = data.proteinName ? data.proteinName.toLowerCase().indexOf(term) > -1 : false;
    const testUniprotAc = data.uniprotAc ? data.uniprotAc.toLowerCase().indexOf(term) > -1 : false;

    return (testType || testName || testEntrez || testProteinName || testUniprotAc);
  }


  select(item) {
    if (item === undefined) {
      return;
    }
    this.selectItem.emit(item);
    // if (this.removeOnSelect) {
    //   let newObj = this.queryItems;
    //   this.queryItems.forEach((wrapper: Wrapper, index, object) => {
    //     if (wrapper.backendId.toString() === item.data.backendId.toString()) {
    //       // remove item
    //       object.splice(index, 1);
    //       newObj = object;
    //     }
    //   });
    //   this.queryItems = [...newObj];
    // }

  }

}
