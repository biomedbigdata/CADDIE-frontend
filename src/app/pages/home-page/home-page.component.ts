import { Component, OnInit, AfterViewInit } from '@angular/core';
import {ControlService} from "../../control.service";

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, AfterViewInit {

  public genes_n: number;
  public proteins_n: number;
  public cancerDriverGenes_n: number;
  public drugs_n: number;

  constructor(private control: ControlService) { }

  private async loadSummary() {
    // load summary information
    const data = await this.control.getSummary()

    this.genes_n = data.nGenes;
    this.cancerDriverGenes_n = data.nCancerDriverGenes;
    this.proteins_n = data.nProteins;
    this.drugs_n = data.nDrugs;
  }

  ngOnInit() {
  }

  async ngAfterViewInit() {
    this.loadSummary()
  }

}
