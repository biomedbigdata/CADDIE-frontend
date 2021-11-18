import {Component, Input, Output, EventEmitter} from '@angular/core';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';
import {Wrapper, CancerType, DiseaseGeneInteraction} from '../../../../../../interfaces';
import {AnalysisService} from '../../../../../../services/analysis/analysis.service';

@Component({
  selector: 'app-info-tile',
  templateUrl: './info-tile.component.html',
  styleUrls: ['./info-tile.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoTileComponent {

  @Input() wrapper: Wrapper;
  @Input() wrapperCancerTypes: CancerType[];
  @Input() wrapperComorbidities: DiseaseGeneInteraction[];
  @Input() nodeDegree: number;  // we need to pass this since we need the network object to calculate it

  @Output()
  public updateSelectedWrapper = new EventEmitter<boolean>();

  public closeSummary() {
    this.updateSelectedWrapper.emit(null)
  }
  wrapperCurrentType = '';

  constructor(public analysis: AnalysisService, public explorerData: ExplorerDataService) {
  }

  public setWrapperCurrentType() {
    this.wrapperCurrentType = this.wrapper.type;
  }

  public beautify(url: string): string {
    if (url.startsWith('https://')) {
      url = url.substr('https://'.length);
    } else if (url.startsWith('http://')) {
      url = url.substr('http://'.length);
    }
    const slashPos = url.indexOf('/');
    if (slashPos !== -1) {
      return url.substr(0, slashPos);
    }
    return url;
  }

}
