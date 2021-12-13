import { Component, Input, OnInit } from '@angular/core';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';

@Component({
  selector: 'app-network-menu-dialog',
  templateUrl: './network-menu-dialog.component.html',
  styleUrls: ['./network-menu-dialog.component.scss']
})
export class NetworkMenuDialogComponent implements OnInit {

  @Input()
  public show = false;

  constructor(public analysis: AnalysisService, public explorerData: ExplorerDataService) { }


  ngOnInit(): void {
  }

  
  public close() {
    this.show = this.explorerData.showNetworkMenuDialog = false;
  }

}
