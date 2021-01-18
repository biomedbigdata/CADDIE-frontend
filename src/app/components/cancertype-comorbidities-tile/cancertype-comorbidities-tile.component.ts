import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {CancerType, Dataset} from '../../interfaces';

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

  constructor() { }

  ngOnInit(): void {

  }

}
