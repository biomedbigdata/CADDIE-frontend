import {Component, EventEmitter, Input, Output} from '@angular/core';
import {InteractionDataset} from "../../interfaces";

@Component({
  selector: 'app-interaction-dataset-tile',
  templateUrl: './interaction-dataset-tile.component.html',
  styleUrls: ['./interaction-dataset-tile.component.scss']
})

export class InteractionDatasetTileComponent {

  @Input() selectedDataset: InteractionDataset;
  @Output() selectedDatasetChange: EventEmitter<any> = new EventEmitter();

  @Input() datasetItems: InteractionDataset[];

  public select(selectionItem) {
    this.selectedDataset = selectionItem;
    this.selectedDatasetChange.emit(selectionItem);
  }

}

