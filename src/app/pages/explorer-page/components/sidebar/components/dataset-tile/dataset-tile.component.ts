import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {Dataset} from '../../../../../../interfaces';

@Component({
  selector: 'app-dataset-tile',
  templateUrl: './dataset-tile.component.html',
  styleUrls: ['./dataset-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DatasetTileComponent {

  @Input() selectedDataset: Dataset;
  @Output() selectedDatasetChange: EventEmitter<any> = new EventEmitter();

  @Input() datasetItems: Dataset[];

  public groupingHelper(item) {
    return item.name
  }

  public select(selectionItem) {
    this.selectedDataset = selectionItem;
    this.selectedDatasetChange.emit(selectionItem);
  }

}
