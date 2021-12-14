import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';
import {
  CancerType,
  Dataset,
  getWrapperFromNode,
  getWrapperFromCancerNode,
  Wrapper
} from '../../../../../../interfaces';
import {AnalysisService} from '../../../../../../services/analysis/analysis.service';
import {ControlService} from '../../../../../../services/control/control.service';

@Component({
  selector: 'app-custom-genes',
  templateUrl: './custom-genes.component.html',
  styleUrls: ['./custom-genes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomGenesComponent implements OnInit {

  @Input()
  public show = false;
  @Output()
  public showChange = new EventEmitter<boolean>();
  @Input()
  public visibleNodes: Array<any> = [];

  public textList = '';
  public genes: Array<string> = [];
  public notFound: Array<string> = [];
  public itemsFound: Array<Wrapper> = [];
  public addedCount = 0;
  public selectOnly = false;
  public loading = false;
  public notCancerGenes: Array<string> = [];

  constructor(private analysis: AnalysisService, private control: ControlService, public explorerData: ExplorerDataService) { }

  ngOnInit(): void {
  }

  public close() {
    this.show = false;
    this.textList = '';
    this.genes = [];
    this.notFound = [];
    this.itemsFound = [];
    this.notCancerGenes = [];
    this.addedCount = 0;
    this.selectOnly = false;
    this.showChange.emit(this.show);
  }

  public async addGenes() {
    this.loading = true;
    this.notFound = [];
    this.itemsFound = [];
    this.notCancerGenes = [];
    const genes = this.genes;
    this.changeTextList('');
    // result contains 'genes' and 'cancerGenes' and 'notFound'
    const result = await this.control.queryGenes(genes, this.explorerData.activeNetwork.selectedDataset, this.explorerData.activeNetwork.selectedCancerTypeItems);
    this.notFound = result.notFound;
    const items = [];
    for (const detail of result.genes) {
      items.push(getWrapperFromNode(detail));
    }
    for (const detail of result.cancerGenes) {
      items.push(getWrapperFromCancerNode(detail));
    }
    this.itemsFound = items;
    this.addedCount = this.analysis.addItems(items);
    this.selectOnly = false;
    this.loading = false;

    if (result.notKnownCancerGenes.length) {
      this.notCancerGenes = result.notKnownCancerGenes;
    }
    // to trigger template update
    this.showChange.emit(this.show);
  }

  public async addVisibleGenes() {
    this.loading = true;
    this.notFound = [];
    this.itemsFound = [];
    this.notCancerGenes = [];
    const genes = this.genes;
    this.changeTextList('');
    // result contains 'genes' and 'cancerGenes' and 'notFound'
    const result = await this.control.queryGenes(genes, this.explorerData.activeNetwork.selectedDataset, this.explorerData.activeNetwork.selectedCancerTypeItems);
    this.notFound = result.notFound;
    const items = [];
    for (const detail of result.genes) {
      items.push(getWrapperFromNode(detail));
    }
    for (const detail of result.cancerGenes) {
      items.push(getWrapperFromCancerNode(detail));
    }
    this.itemsFound = items;
    this.addedCount = this.analysis.addVisibleGenes(this.visibleNodes, result.genes);
    this.addedCount += this.analysis.addVisibleCancerDriverGenes(this.visibleNodes, result.cancerGenes);
    this.selectOnly = true;
    this.loading = false;
    // to trigger template update
    this.showChange.emit(this.show);
  }

  public changeTextList(textList) {
    this.textList = textList;
    if (!textList) {
      this.genes = [];
      return;
    }

    const filterOut = [`'`];
    const separators = ['\n', ',', ';', ' '];

    for (const char of filterOut) {
      textList = textList.replaceAll(char, '');
    }

    let genes;
    for (const sep of separators) {
      if (textList.indexOf(sep) === -1) {
        continue;
      }
      genes = textList.split(sep).map(ac => ac.trim()).filter(ac => !!ac);
      break;
    }

    if (!genes) {
      genes = [textList];
    }

    this.genes = genes;
  }

}
