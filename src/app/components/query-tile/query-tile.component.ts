import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Gene, Wrapper, CancerDriverGene} from '../../interfaces';

@Component({
  selector: 'app-query-tile-component',
  templateUrl: './query-tile.component.html',
  styleUrls: ['./query-tile.component.scss']
})
export class QueryTileComponent {


  @Output() selectItem: EventEmitter<any> = new EventEmitter();
  @Input() queryItems: Wrapper[];

  querySearch(term: string, item: Wrapper) {
    term = term.toLowerCase();
    if (item.type === 'gene') {
      const data = item.data as Gene;
      return data.name.toLowerCase().indexOf(term) > -1 || data.id.toLowerCase().indexOf(term) > -1 ||
        item.type.toLowerCase().indexOf(term) > -1;
    } else {
      const data = item.data as CancerDriverGene;
      return data.geneName.toLowerCase().indexOf(term) > -1 || data.cancerType.toLowerCase().indexOf(term) > -1 ||
        item.type.toLowerCase().indexOf(term) > -1;
    }
  }

  select(item) {
    this.selectItem.emit(item);
  }

}
