import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {AnalysisService} from '../../services/analysis/analysis.service';
import {getWrapperFromNode, getWrapperFromCancerNode, Node, ExpressionCancerType, CancerNode} from '../../interfaces';
import {ControlService} from '../../services/control/control.service';

@Component({
  selector: 'app-add-cancer-expressed-genes',
  templateUrl: './add-cancer-expressed-genes.component.html',
  styleUrls: ['./add-cancer-expressed-genes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCancerExpressedGenesComponent implements OnChanges {

  @Input()
  public show = false;
  @Output()
  public showChange = new EventEmitter<boolean>();
  @Input()
  public visibleNodes: Array<any> = [];
  @Input()
  public currentViewGenes: Array<Node> = [];
  @Input()
  public currentViewCancerGenes: Array<CancerNode> = [];
  @Input()
  public selectedExpressionCancerType: ExpressionCancerType | null = null;

  public genes = [];
  public threshold = 5;
  public addedCount: number | null = null;
  public loading = false;

  constructor(private analysis: AnalysisService, private control: ControlService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setThreshold(this.threshold);
  }

  public async addGenes() {
    this.loading = true;
    const result = await this.control.queryExpressionCancerTypeGenes(this.selectedExpressionCancerType, this.threshold);
    const items = [];
    for (const detail of result.genes) {
      items.push(getWrapperFromNode(detail));
    }
    for (const detail of result.cancerGenes) {
      items.push(getWrapperFromCancerNode(detail));
    }
    this.addedCount = this.analysis.addItems(items);
    this.loading = false;
  }

  public addVisibleGenes() {
    this.loading = true;
    let count = 0;
    count += this.analysis.addExpressedGenes(
      this.visibleNodes, this.currentViewGenes, this.threshold, 'Node');
    count += this.analysis.addExpressedGenes(
      this.visibleNodes, this.currentViewCancerGenes, this.threshold, 'CancerNode');
    this.addedCount = count;
    this.loading = false;
  }

  public setThreshold(threshold: number) {
    this.threshold = threshold;
    if (!this.currentViewGenes) {
      return;
    }
    this.genes = [...this.currentViewGenes, ...this.currentViewCancerGenes].filter(p => p.expressionLevel >= threshold);
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
    this.addedCount = null;
  }

}

