import { Component, OnInit, AfterViewInit } from '@angular/core';
import {ControlService} from '../../services/control/control.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, AfterViewInit {

  public genesN: number;
  public proteinsN: number;
  public cancerDriverGenesN: number;
  public drugsN: number;

  constructor(private control: ControlService) { }

  private async loadSummary() {
    // load summary information
    const data = await this.control.getSummary();

    this.genesN = data.nGenes;
    this.cancerDriverGenesN = data.nCancerDriverGenes;
    this.proteinsN = data.nProteins;
    this.drugsN = data.nDrugs;
  }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    this.loadSummary();
  }

}
