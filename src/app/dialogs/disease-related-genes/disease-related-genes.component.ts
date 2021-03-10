import {AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {
  CancerNode,
  CancerType,
  getWrapperFromCancerNode,
  getWrapperFromNode,
  Node,
  Disease,
  Dataset
} from '../../interfaces';
import {AnalysisService} from '../../services/analysis/analysis.service';
import {ControlService} from '../../services/control/control.service';

@Component({
  selector: 'app-disease-related-genes',
  templateUrl: './disease-related-genes.component.html',
  styleUrls: ['./disease-related-genes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiseaseRelatedGenesComponent implements AfterViewInit {

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
  public currentCancerDataset: Dataset;
  @Input()
  public currentCancerTypeItems: CancerType[];

  public addedCount: number | null = null;
  public loading = false;
  public selectedDiseases: Disease[] | [] = [];
  public diseases: Disease[] | [] = [];


  constructor(private analysis: AnalysisService, private control: ControlService) {
  }

  async ngAfterViewInit() {
    if (!this.diseases.length) {
      const diseaseData = await this.control.getDiseases();
      this.diseases = diseaseData.diseases;
    }
  }

  public async addGenes() {
    /**
     * Adding genes to selection based on selected Diseases
     * Genes are fetched from API. All genes in selected cancer types are taken into account.
     */
    this.loading = true;
    const result = await this.control.queryDiseaseGenesByCancer(
      this.selectedDiseases,
      this.currentCancerDataset,
      this.currentCancerTypeItems
    );
    const items = [];
    for (const detail of result.genes) {
      items.push(getWrapperFromNode(detail));
    }
    for (const detail of result.cancerGenes) {
      items.push(getWrapperFromCancerNode(detail));
    }
    this.addedCount = this.analysis.addItems(items);
    this.loading = false;
    // to trigger template update
    this.showChange.emit(this.show);
  }

  public async addVisibleGenes() {
    /**
     * Marking genes as selected if they occur in selected diseases.
     * Looks up all genes in current network.
     */
    this.loading = true;
    const result = await this.control.queryDiseaseGenesByGenes(
      this.selectedDiseases,
      this.currentViewGenes,
      this.currentViewCancerGenes
    );
    let count = 0;
    count += this.analysis.addDiseaseGenes(
      this.visibleNodes, this.currentViewGenes, result.inDiseasesGenes, 'Node');
    count += this.analysis.addDiseaseGenes(
      this.visibleNodes, this.currentViewCancerGenes, result.inDiseasesCancerGenes, 'CancerNode');
    this.addedCount = count;
    this.loading = false;
    // to trigger template update
    this.showChange.emit(this.show);
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
    this.addedCount = null;
  }

  public select(selectionItem) {
    this.selectedDiseases = selectionItem;

  }

}
