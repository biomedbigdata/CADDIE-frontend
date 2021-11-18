import { Component, AfterViewInit } from '@angular/core';
import { CancerNode } from 'src/app/interfaces';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements AfterViewInit {

  constructor(public explorerData: ExplorerDataService, public analysis: AnalysisService) { }

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

}
