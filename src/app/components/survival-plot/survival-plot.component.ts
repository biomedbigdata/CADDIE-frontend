import {Component, EventEmitter, Input, AfterViewInit, Output} from '@angular/core';
import { ControlService } from 'src/app/services/control/control.service';
import {BackendObject, TCGADataset, Wrapper} from '../../interfaces';

@Component({
  selector: 'app-survival-plot',
  templateUrl: './survival-plot.component.html',
  styleUrls: ['./survival-plot.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SurvivalPlotComponent implements AfterViewInit {

  @Input() wrapper: Wrapper;
  @Input() graph: {data: any, layout: any};
  @Output() callbackFun = new EventEmitter<any>();

  private TCGADatasets: BackendObject[];
  private selectedTCGADataset: BackendObject;

  constructor(private control: ControlService) { }

  async ngAfterViewInit() {
    /**
     * Initializes Survival Plot Component
     */

    if (!this.TCGADatasets) {
      // cancer datasets are always loaded
      await this.initTCGADatasets();
    }
  }

  public async initTCGADatasets() {
    const rawTCGADatasets = await this.control.getTCGADatasets();
    this.TCGADatasets =  [];
    rawTCGADatasets.forEach( (ds: TCGADataset) => {
      this.TCGADatasets.push({
        name: ds.disease_name,
        backendId: 9999 // placeholder
      });
    });
  }

  public async selectTCGADataset(dataset: BackendObject | null) {
    if (dataset === null) {
      // remove graph
      this.graph = undefined;
      return;
    }

    this.selectedTCGADataset = dataset;

    // get survival p values
    const pValue = await this.control.getSurvivalPValue(
      this.selectedTCGADataset.name,
      this.wrapper.data.name
    );
    const rates = await this.control.getSurvivalRates(
      this.selectedTCGADataset.name,
      this.wrapper.data.name
    );
    this.computeKMP(rates, pValue);
  }

  /**
   * TAKEN LIKE THIS FROM SPONGEDB
   */
  private parseSurvivalData(response, seenTime) {
    const samples = [];

    const allResp = JSON.stringify(response);
    const allResp2 = JSON.parse(allResp);

    allResp2.forEach(element => {
      samples.push(element);
    });
    samples.sort((a, b) => (a.patient_information.survival_time > b.patient_information.survival_time) ? 1 : -1);
    const SEArray = [];
    let lastEstimate = 1;
    samples.forEach( sampleI => {

      if (sampleI.patient_information.survival_time !== null && !seenTime.includes(sampleI.patient_information.survival_time)) {
        const time = sampleI.patient_information.survival_time;
        seenTime.push(time);
        const censored0 = [];
        const censored1 = [];
        let countTime = 0;
        let biggerEqualTime = 0;
        samples.forEach( sampleJ => {
          if (sampleJ.patient_information.survival_time === time) {
            if (sampleJ.patient_information.disease_status === 0) {
              censored0.push(sampleJ);
            } else {
              censored1.push(sampleJ);
            }
            countTime++;
          }
          if (sampleJ.patient_information.survival_time >= time) {
            biggerEqualTime += 1;
          }
        });
        const n = censored0.length;
        const estimate = lastEstimate * (1 - (n / biggerEqualTime));
        lastEstimate = estimate;
        SEArray.push(estimate);
      }
    });
    return SEArray;
  }

  /**
   * TAKEN LIKE THIS FROM SPONGEDB
   */
  private plot_KMP(meanSe, overexpression0se, overexpression1se, seenTimeMean, seenTime1, seenTime0, pValue, nodeName) {

    // const mean = {
    //   x: seenTimeMean,
    //   y: meanSe,
    //   type: 'scatter',
    //   name: 'Normal SE calculations'
    // };

    const overexpression0 = {
      x: seenTime0,
      y: overexpression0se,
      type: 'scatter',
      name: 'Underexpressed Genes'
    };

    const overexpression1 = {
      x: seenTime1,
      y: overexpression1se,
      type: 'scatter',
      name: 'Overexpressed Genes'
    };

    const data = [overexpression0, overexpression1];
    const layout = {
      legend: {
        xanchor: 'center',
        yanchor: 'top',
        orientation: 'h',
        y: -0.35,
        x: 0.5
      },
      annotations: [
        {
          xref: 'paper',
          yref: 'paper',
          x: 1,
          xanchor: 'left',
          y: 0.83,
          yanchor: 'top',
          text: 'p-Value: ' + pValue[0].pValue,
          showarrow: false,
          textangle: -90,
          font: {
            family: 'Arial, bold',
            size: 10,
            color: 'cc0066'
          }
        }],
      title: {
        text: nodeName,
        font: {
          family: 'Arial, bold',
          size: 14,
          color: '#052444',
        }
      },
      xaxis: {
        title: 'Duration (Days)',
        autorange: true,
        hoverformat: '.3f'
      },
      yaxis: {
        title: 'Survival Rate',
        autorange: true,
        hoverformat: '.3f'
      },
      hoverlabel: {
        namelength: 50
      }
    };
    this.graph = {
      data,
      layout
    };
    this.callbackFun.emit(true);
  }

  private computeKMP(rates, pValue) {
    const overexpression0 = [];
    const overexpression1 = [];
    const meanSE = [];
    let overexpression0SE = [];
    let overexpression1SE = [];
    const seenTimeMean = [];
    const seenTime0 = [];
    const seenTime1 = [];

    // const mean_se = this.parseSurvivalData(rates, seenTimeMean);

    rates.forEach((element) => {
      if (element.overexpression) {
        overexpression1.push(element);
      } else {
        overexpression0.push(element);
      }
    });

    overexpression1SE = this.parseSurvivalData(overexpression1, seenTime1);
    overexpression0SE = this.parseSurvivalData(overexpression0, seenTime0);

    this.plot_KMP(
      meanSE,
      overexpression0SE,
      overexpression1SE,
      seenTimeMean,
      seenTime1,
      seenTime0,
      pValue,
      rates
      );
  }
}
