import {Component, OnInit, AfterViewInit} from '@angular/core';
import {ControlService} from '../../services/control/control.service';
import {CancerType, Dataset, Node, Drug} from '../../interfaces';
import {toast} from 'bulma-toast';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-gene-lookup-page',
  templateUrl: './gene-lookup-page.component.html',
  styleUrls: ['./gene-lookup-page.component.scss']
})
export class GeneLookupPageComponent implements OnInit, AfterViewInit {

  public searchString: string;
  public searchResult: {
    gene: {gene: Node, cancer_datasets: Dataset[]}[],
    found: boolean,
    drugs: Drug[],
    cancerTypes: CancerType[],
  };

  public interactionDrugDatasetItems: Dataset[];
  public selectedInteractionDrugDataset: Dataset;

  constructor(
    private control: ControlService,
  ) { }

  ngOnInit(): void {
  }

  async ngAfterViewInit() {
    await this.initInteractionDrugDatasets();
  }

  public onKey(event) { this.searchString = event.target.value; }

  public async initInteractionDrugDatasets() {
    /**
     * Fetches Cancer Dataset data from API and initializes dataset tile
     */
    this.interactionDrugDatasetItems = await this.control.getInteractionDrugDatasets();
    this.selectedInteractionDrugDataset = this.interactionDrugDatasetItems[0];
  }

  public async lookGeneUp(searchString: string, drugDataset: Dataset) {
    if (searchString === undefined) {
      return;
    }
    this.searchResult = await this.control.geneDrugLookup(searchString.trim(), drugDataset);

    if (!this.searchResult.found) {
      toast({
        message: `No Gene was found for '${searchString}'.`,
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
        type: 'is-danger',
        position: 'top-center',
        animate: {in: 'fadeIn', out: 'fadeOut'}
      });
    }
  }

  public extractNames(objectList: CancerType[] | Dataset[]) {
    if (objectList === undefined) {
      return [];
    }
    // @ts-ignore
    const names = objectList.map((x) => x.name);
    return names;
  }

  public downloadLink(view: string) {
    const text = this.searchString;
    const fmt = view;
    const dataset = this.selectedInteractionDrugDataset.backendId;
    return `${environment.backend}gene_drug_interaction_lookup/?&text=${text}&fmt=${fmt}&dataset_id=${dataset}`;
  }

  public previewStringArray(arr: string[], count: number): string {
    if (arr.length < count) {
      return arr.join(', ');
    } else {
      return arr.slice(0, count).join(', ') + `, ... (${arr.length})`;
    }
  }
}
