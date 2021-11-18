import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { ControlService } from 'src/app/services/control/control.service';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';
import {CancerType, Dataset, Disease} from '../../interfaces';

@Component({
  selector: 'app-cancertype-comorbidities-tile',
  templateUrl: './cancertype-comorbidities-tile.component.html',
  styleUrls: ['./cancertype-comorbidities-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CancertypeComorbiditiesTileComponent implements OnInit {

  public _selectedCancerTypeItems: CancerType[];
  @Input() 
  public set selectedCancerTypeItems(val: CancerType[]) {
    this._selectedCancerTypeItems = val;
    this.loadCancerTypeComorbiditesGraph();
  }
  @Input() selectedCancerDataset: Dataset[];
  @Input() selectedCancerTypeComorbidityGraph: {data: any, layout: any};

  @Output() selectedDisease: EventEmitter<Disease> = new EventEmitter();


  constructor(public explorerData: ExplorerDataService, public control: ControlService) { }

  ngOnInit(): void {

  }

  public select_comorbidity_seeds(data) {
    const index = data.points[0].pointIndex;
    const diseaseObject = data.points[0].data.diseaseObjects[index];
    this.selectedDisease.emit(diseaseObject);
  }

  public async loadCancerTypeComorbiditesGraph() {
    // TODO gets just one cancer type data
    if (this._selectedCancerTypeItems !== undefined && this._selectedCancerTypeItems.length > 0) {
      const data = await this.control.getComorbiditiesForCancerType(
        this.explorerData.activeNetwork.selectedDataset,
        this._selectedCancerTypeItems,
      );
      this.explorerData.numberGenesInComorbidities = data.nCancerGenes;
      const k = 5;

      // get the top 5 occuring diseases (can be more if counts are the same, list will be cropped later)
      const counts = Object.values(data.counts);
      // sort in descending order
      counts.sort((a: number, b: number) => b - a );
      const highestValues = counts.slice(0, k);
      // iterate over data to filter out top k counts
      const keys = [];
      const values = [];
      const diseaseObjects: Disease[] = [];
      for (let[key, val] of Object.entries(data.counts)) {

        // if val is among highest counts
        if (highestValues.includes(val)) {
          // TODO do this when inserting in db
          // split key on comma
          key = key.includes(',') ? key.split(',')[0] : key;

          // replace every third white space with linebreak
          let nth = 0;

          // collect disease objects for on click callback
          diseaseObjects.push(data.diseaseObjects[key]);

          key = key.replace(/\s/g, (match, i, original) => {
            nth++;
            if (nth === 3) {
              nth = 0;
              return '&nbsp;<br>';
            } else {
              return match;
            }
          });
          keys.push(key + '&nbsp;');
          values.push(val);
        }
      }

      // make sure that lists are just k long, this might not be given if we have duplicates in the highest values
      // drop possible more values
      keys.length = k;
      values.length = k;

      // set title dynmically based on amount of selected cancer types
      let title = '';
      if (this._selectedCancerTypeItems.length > 1) {
        title = 'Comorbidities in selected Cancer Types';
      } else {
        title = `Comorbidities in ${this._selectedCancerTypeItems[0].name}`;
      }
      // title += `<br> (${this.numberGenesInComorbidities} Cancer Genes)`;

      const graphData = {
        data: [
          { y: keys,
            x: values,
            diseaseObjects,
            type: 'bar',
            orientation: 'h',
            transforms: [{
              type: 'sort',
              target: 'x',
              order: 'ascending'
            }],
            marker: {
              color: '#8c4c8c'
            }},
        ],

        layout: {
          title: `${title}`,
          margin: {
            l: 200
          },
          xaxis: {
            title: 'Common Cancer Genes',
          }
        },
        config: {
          responsive: true
        }
      };

      this.selectedCancerTypeComorbidityGraph = graphData;
    } else {
      this.selectedCancerTypeComorbidityGraph = undefined;
    }
  }

}
