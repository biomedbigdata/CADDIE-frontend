import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { ControlService } from 'src/app/services/control/control.service';
import {BackendObject, TCGADataset, Wrapper} from '../../interfaces';

@Component({
  selector: 'app-survival-plot',
  templateUrl: './survival-plot.component.html',
  styleUrls: ['./survival-plot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SurvivalPlotComponent implements OnInit {

  @Input() wrapper: Wrapper;
  @Input() graph: {data: any, layout: any};
  @Output() callbackFun = new EventEmitter<any>();

  private TCGADatasets: BackendObject[];
  private selectedTCGADataset: BackendObject;

  private datasetSelectorExpanded: false;

  constructor(private control: ControlService) { }

  ngOnInit(): void {
  }

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
      })
    } )
    this.selectedTCGADataset = this.TCGADatasets[0];
  }

  public async selectTCGADataset(dataset: BackendObject) {
    this.selectedTCGADataset = dataset;

    // get survival p values
    const pValue = await this.control.getSurvivalPValue(
      this.selectedTCGADataset.name, 
      this.wrapper.data.name
    )
    const rates = await this.control.getSurvivalRates(
      this.selectedTCGADataset.name, 
      this.wrapper.data.name
    )
    this.computeKMP(rates, pValue)
  }

  /**
   * 
   * @param response TAKEN LIKE THIS FROM SPONGEDB
   * @param seen_time 
   * @returns 
   */
  private parse_survival_data(response, seen_time) {
    let samples = [];

    var allResp = JSON.stringify(response);
    var allResp2 = JSON.parse(allResp);

    for (let i = 0; i < allResp2.length; i++) {  //rausziehen der patienten info
      //Gleich berechnen des SE u speichern des ergebnisses in array mit sample id u (gene)//
      //Dafür abspeichern des JSon in seperaten array damit man eins zum durchsuchen hat und eins zum abarbeiten
      samples.push(allResp2[i]);

    }
    //Sortieren nach der survival time
    samples.sort((a, b) => (a.patient_information.survival_time > b.patient_information.survival_time) ? 1 : -1);
    //TO-DO sicherstellen das 1 zeit auch nur 1 mal durchgegangen wird
    let SE_array = []
    // let seen_time =[]
    let last_estimate = 1;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].patient_information.survival_time != null && !seen_time.includes(samples[i].patient_information.survival_time)) {
        let time = samples[i].patient_information.survival_time;
        seen_time.push(time);
        //  seen_time_input.push(time);

        //alle einträge mit der time raus holen
        let censored_0 = [];
        let censored_1 = [];
        let count_time = 0;
        let bigger_equal_time = 0;
        //Durchsuchen von samples nach der zeit u zählen wie viele 0 und 1 wobei 0 ein event ist also tod
        for (let j = 0; j < samples.length; j++) {
          if (samples[j].patient_information.survival_time == time) {
            if (samples[j].patient_information.disease_status == 0) {
              censored_0.push(samples[j]);
            } else {
              censored_1.push(samples[j]);
            }
            count_time++; //wie viele insgesamt mit der time gibt es
          }
          if (samples[j].patient_information.survival_time >= time) {
            bigger_equal_time += 1
          }
        }

        let n = censored_0.length; //hier ist ein tod eingetreten 

        var estimate = last_estimate * (1 - (n / bigger_equal_time));
        last_estimate = estimate;

        SE_array.push(estimate);
      }
    }

    return SE_array;
  }

  /**
   * 
   * @param mean_se TAKEN LIKE THIS FROM SPONGEDB
   * @param overexpression_0_se 
   * @param overexpression_1_se 
   * @param seen_time_mean 
   * @param seen_time_1 
   * @param seen_time_0 
   */
  private plot_KMP(mean_se, overexpression_0_se, overexpression_1_se, seen_time_mean, seen_time_1, seen_time_0, pValue, nodeName) {

    // Plotly.purge('myDiv_'+gene_name); $('#network-plot-container').val().toString()
    var genename

    var sestimateGesamt = [];

    //Holen der wichtigen Daten und berechnen der Werte + speichern in trace
    const mean = {
      x: seen_time_mean,
      y: mean_se,
      type: 'scatter',
      name: 'Normal SE calculations'
    };

    const overexpression_0 = {
      x: seen_time_0,
      y: overexpression_0_se,
      type: 'scatter',
      name: 'Underexpressed Genes'
    };

    const overexpression_1 = {
      x: seen_time_1,
      y: overexpression_1_se,
      type: 'scatter',
      name: 'Overexpressed Genes'
    };

    const data = [overexpression_0, overexpression_1];
    const layout = {
      // autosize: false,
      //  width:480,
      // height: 400,
      // legend:{
      //   orientation:"h",
      //   y: -0.35,
      // },
      legend: {
        xanchor: "center",
        yanchor: "top",
        orientation: 'h',
        y: -0.35, // play with it
        x: 0.5   // play with it
      },
      annotations: [
        {
          xref: 'paper',
          yref: 'paper',
          x: 1,
          xanchor: 'left',
          y: 0.83,
          yanchor: 'top',
          text: 'p-Value: ' + pValue,
          showarrow: false,
          textangle: -90,
          font: {
            family: 'Arial, bold',
            size: 10,
            color: "cc0066"
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
      data: data,
      layout: layout
    }
    this.callbackFun.emit(true);
    console.log("graph")
    console.log(this.graph)

    // Plotly.plot('myDiv_' + response.gene.ensg_number, data, layout, { showSendToCloud: true });
  };

  private computeKMP(rates, pValue){
    const overexpression0 = []
    const overexpression1 = []
    const meanSE = []
    let overexpression0SE = []
    let overexpression1SE = []
    const seenTimeMean = []
    const seenTime0 = []
    const seenTime1 = []

    const mean_se = this.parse_survival_data(rates, seenTimeMean);

    rates.forEach((element) => {
      if (element.overexpression) {
        overexpression1.push(element);
      } else {
        overexpression0.push(element);
      }
    })

    overexpression1SE = this.parse_survival_data(overexpression1, seenTime1);
    overexpression0SE = this.parse_survival_data(overexpression0, seenTime0);

    this.plot_KMP(
      meanSE, 
      overexpression0SE, 
      overexpression1SE,
      seenTimeMean,
      seenTime1,
      seenTime0,
      pValue,
      rates
      )
  } 



}
