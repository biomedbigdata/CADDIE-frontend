import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AnalysisService} from '../../../../../../services/analysis/analysis.service';
import {ControlService} from '../../../../../../services/control/control.service';
import {CancerType, Dataset, getWrapperFromCancerNode, getWrapperFromNode, Wrapper} from '../../../../../../interfaces';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';

@Component({
  selector: 'app-vcf-input',
  templateUrl: './vcf-input.component.html',
  styleUrls: ['./vcf-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VcfInputComponent implements OnInit {

  @Input()
  public show = true;
  @Output()
  public showChange = new EventEmitter<boolean>();
  @Output()
  public triggerTemplateUpdate = new EventEmitter<boolean>();

  constructor(private analysis: AnalysisService, private control: ControlService, public explorerData: ExplorerDataService) { }

  public fileContent: string = null;
  public loading = false;
  public threshold = 0.85;

  public textList = '';
  public genes: Array<string> = [];
  public notFound: Array<string> = [];
  public itemsFound: Array<Wrapper> = [];
  public addedCount = 0;
  public selectOnly = false;

  ngOnInit(): void {
  }

  public close() {
    this.fileContent = null;
    this.showChange.emit(false);
  }

  async handleFileInput(event) {
    const file = event.target.files[0];
    this.readFile(file, (content) => {
      this.fileContent = content;
      this.triggerTemplateUpdate.emit(true);
    });
  }

  handleThresholdInput(threshold: number) {
    this.threshold = threshold;
  }

  readFile(file: File, callback) {
    if (!window.FileReader)  { return; } // Browser is not compatible

    const reader = new FileReader();
    reader.onload = (evt) => {
      if ( evt.target.readyState !== 2) { return; }
      if (evt.target.error) {
        alert('Error while reading file');
        return;
      }

      // result is file content
      callback(evt.target.result);
    };

    reader.readAsText(file);

  }

  public async addGenes() {
    this.loading = true;
    this.notFound = [];
    this.itemsFound = [];
    // result contains 'genes' and 'cancerGenes' and 'notFound'
    const result = await this.control.queryGenes(this.genes, this.explorerData.activeNetwork.currentCancerDataset, this.explorerData.activeNetwork.currentCancerTypeItems);
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
    // to trigger template update
    this.showChange.emit(this.show);
  }

  async loadSeeds() {
    this.loading = true;
    const response = await this.control.vcfLookup(this.fileContent, this.threshold);
    this.genes = response.data.map((gene) => gene.entrezId.toString());
    this.addGenes();

    this.loading = false;
  }

}
