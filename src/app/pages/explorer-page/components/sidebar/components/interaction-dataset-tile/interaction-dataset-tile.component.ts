import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Dataset } from '../../../../../../interfaces';


@Component({
  selector: 'app-interaction-dataset-tile',
  templateUrl: './interaction-dataset-tile.component.html',
  styleUrls: ['./interaction-dataset-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class InteractionDatasetTileComponent {

  @Input() selectedDataset: Dataset;
  @Output() selectedDatasetChange: EventEmitter<any> = new EventEmitter();

  @Input() datasetItems: Dataset[];

  public select(selectionItem) {
    this.selectedDataset = selectionItem;
    this.selectedDatasetChange.emit(selectionItem);
  }

  public kFormatter(num) {
    return Math.abs(num) > 999 ? Math.sign(num) * (<any>(Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)
  }

}

