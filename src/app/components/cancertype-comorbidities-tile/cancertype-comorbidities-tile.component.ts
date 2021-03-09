import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CancerType, Dataset, Disease} from '../../interfaces';

@Component({
  selector: 'app-cancertype-comorbidities-tile',
  templateUrl: './cancertype-comorbidities-tile.component.html',
  styleUrls: ['./cancertype-comorbidities-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CancertypeComorbiditiesTileComponent implements OnInit {

  @Input() selectedCancerTypeItems: CancerType[];
  @Input() selectedCancerDataset: Dataset[];
  @Input() selectedCancerTypeComorbidityGraph: {data: any, layout: any};

  @Output() selectedDisease: EventEmitter<Disease> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {

  }

  public select_comorbidity_seeds(data) {
    const index = data.points[0].pointIndex;
    const diseaseObject = data.points[0].data.diseaseObjects[index];
    this.selectedDisease.emit(diseaseObject);
  }

}
