import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {getWrapperFromNode, Node, Wrapper} from '../../interfaces';
import {AnalysisService} from '../../services/analysis/analysis.service';
import {ControlService} from '../../services/control/control.service';

@Component({
  selector: 'app-custom-genes',
  templateUrl: './custom-genes.component.html',
  styleUrls: ['./custom-genes.component.scss']
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

  constructor(private analysis: AnalysisService, private control: ControlService) { }

  ngOnInit(): void {
  }

  public close() {
    this.show = false;
    this.textList = '';
    this.genes = [];
    this.notFound = [];
    this.itemsFound = [];
    this.showChange.emit(this.show);
    this.addedCount = 0;
    this.selectOnly = false;
  }

  public async addGenes() {
    this.loading = true;
    this.notFound = [];
    this.itemsFound = [];
    const genes = this.genes;
    this.changeTextList('');
    const result = await this.control.queryGenes(genes);
    this.notFound = result.notFound;
    const details = result.details;
    const items = [];
    for (const detail of details) {
      items.push(getWrapperFromNode(detail));
    }
    this.itemsFound = items;
    this.addedCount = this.analysis.addItems(items);
    this.selectOnly = false;
    this.loading = false;
  }

  public async addVisibleGenes() {
    this.loading = true;
    this.notFound = [];
    this.itemsFound = [];
    const genes = this.genes;
    this.changeTextList('');
    const result = await this.control.queryGenes(genes);
    this.notFound = result.notFound;
    const details = result.details;
    const geneItems = [];
    const items = [];
    for (const detail of details) {
      geneItems.push(detail as Node);
      items.push(getWrapperFromNode(detail));
    }
    this.itemsFound = items;
    this.addedCount = this.analysis.addVisibleGenes(this.visibleNodes, geneItems);
    this.selectOnly = true;
    this.loading = false;
  }

  public changeTextList(textList) {
    this.textList = textList;
    if (!textList) {
      this.genes = [];
      return;
    }

    const separators = ['\n', ',', ';', ' '];

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
