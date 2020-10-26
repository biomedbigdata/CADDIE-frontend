import {Component, Input, OnInit} from '@angular/core';
import {Wrapper, CancerType, DiseaseGeneInteraction} from '../../interfaces';
import {AnalysisService} from '../../services/analysis/analysis.service';

@Component({
  selector: 'app-info-tile',
  templateUrl: './info-tile.component.html',
  styleUrls: ['./info-tile.component.scss']
})
export class InfoTileComponent implements OnInit {

  @Input()
  public wrapper: Wrapper;
  @Input()
  public wrapperCancerTypes: CancerType[];
  @Input()
  public wrapperComorbidities: DiseaseGeneInteraction[];

  constructor(public analysis: AnalysisService) { }

  ngOnInit(): void {
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
