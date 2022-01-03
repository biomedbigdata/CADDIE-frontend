import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {AnalysisService} from '../../../../../../services/analysis/analysis.service';
import {getWrapperFromNode, getWrapperFromCancerNode, Node, ExpressionCancerType, CancerNode, MutationCancerType} from '../../../../../../interfaces';
import {ControlService} from '../../../../../../services/control/control.service';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';

@Component({
  selector: 'app-add-mutated-genes',
  templateUrl: './add-mutated-genes.component.html',
  styleUrls: ['./add-mutated-genes.component.scss']
})
export class AddMutatedGenesComponent implements OnChanges {

  @Input()
  public show = false;
  @Output()
  public showChange = new EventEmitter<boolean>();
  @Input()
  public visibleNodes: Array<any> = [];
  @Input()
  public basicNodes: Array<Node> = [];
  @Input()
  public cancerNodes: Array<CancerNode> = [];
  @Input()
  public selectedMutationCancerType: MutationCancerType | null = null;

  public genes = [];
  public threshold = 0.8;
  public addedCount: number | null = null;
  public loading = false;

  constructor(private analysis: AnalysisService, private control: ControlService, public explorerData: ExplorerDataService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setThreshold(this.threshold);
  }

  public async addGenes() {
    if (this.threshold < 0.6) {
      if (!window.confirm(`Low thresholds lead to long loading times, do you still want to continue?`)) return;
    }

    this.loading = true;
    const result = await this.control.queryCancerTypeMutationGenes(this.selectedMutationCancerType, this.threshold, this.explorerData.activeNetwork.selectedCancerTypeItems);
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
    count += this.analysis.addMutatedGenes(
      this.explorerData.activeNetwork.nodeData.nodes, this.explorerData.activeNetwork.basicNodes, this.threshold, 'Node');
    count += this.analysis.addMutatedGenes(
      this.explorerData.activeNetwork.nodeData.nodes, this.explorerData.activeNetwork.cancerNodes, this.threshold, 'CancerNode');
    this.addedCount = count;
    this.loading = false;
  }

  public setThreshold(threshold: number) {
    this.threshold = threshold;
    if (!this.explorerData.activeNetwork.basicNodes) {
      return;
    }
    this.genes = [...this.explorerData.activeNetwork.basicNodes, ...this.explorerData.activeNetwork.cancerNodes].filter(p => p.mutationScore >= threshold);
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
    this.addedCount = null;
  }
}
