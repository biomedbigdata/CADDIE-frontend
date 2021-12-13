import { Component, AfterViewInit } from '@angular/core';
import { CancerNode } from 'src/app/interfaces';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';
import { LoadingOverlayService } from 'src/app/services/loading-overlay/loading-overlay.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements AfterViewInit {

  constructor(public explorerData: ExplorerDataService, public analysis: AnalysisService, private loadingOverlay: LoadingOverlayService) { }

  ngAfterViewInit(): void {
  }

  // sidebar collapse variables
  public collapseAnalysisQuick = true;
  public collapseAnalysis = true;
  public collapseDetails = true;
  public collapseTask = true;
  public collapseSelection = true;
  public collapseBaitFilter = false;
  public collapseQuery = false;
  public collapseData = true;
  public collapseOverview = true;
  public collapseType = true;
  public collapseLevel = true;

  public async buildMainNetwork() {
    if (!this.explorerData.activeNetwork.selectedCancerTypeItems.length) {
      return
    }
    this.loadingOverlay.addTo('loadingOverlayTarget');
    await this.explorerData.activeNetwork.getMainNetwork(
        this.explorerData.activeNetwork.selectedDataset,
        this.explorerData.activeNetwork.selectedInteractionGeneDataset,
        this.explorerData.activeNetwork.selectedCancerTypeItems
      )
    await this.explorerData.activeNetwork.createNetwork()
    await this.explorerData.activeNetwork.setNetworkDefaultSettings();
    this.loadingOverlay.removeFrom('loadingOverlayTarget');
  }

}
