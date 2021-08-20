import {Component, OnInit, AfterViewInit} from '@angular/core';
import {ControlService} from '../../services/control/control.service';
import {CancerType, Dataset, Node, Drug} from '../../interfaces';
import {toast} from 'bulma-toast';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-drug-lookup-page',
  templateUrl: './drug-lookup-page.component.html',
  styleUrls: ['./drug-lookup-page.component.scss'],
})
export class DrugLookupPageComponent implements OnInit, AfterViewInit {

  public searchString: string;
  public searchResult: {
    genes: {gene: Node, cancer_types: CancerType[], cancer_datasets: Dataset[]}[],
    found: boolean,
    drug: Drug[]
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

  public async lookDrugUp(searchString: string, drugDataset: Dataset) {
    if (searchString === undefined) {
      return;
    }
    this.searchResult = await this.control.drugLookup(searchString.trim(), drugDataset);
    if (!this.searchResult.found) {
      toast({
        message: `No Drug was found for '${searchString}'.`,
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
    return `${environment.backend}drug_interaction_lookup/?&text=${text}&fmt=${fmt}&dataset_id=${dataset}`;
  }

  public previewStringArray(arr: string[], count: number): string {
    if (arr.length < count) {
      return arr.join(', ');
    } else {
      return arr.slice(0, count).join(', ') + `, ... (${arr.length})`;
    }
  }

}
