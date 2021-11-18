import {
  AfterViewInit,
  Component,
  OnInit,
} from '@angular/core';
import {
  Interaction,
  CancerNode,
  Node,
  Wrapper,
  CancerType,
  Dataset,
  DiseaseGeneInteraction,
  NetworkType,
} from '../../interfaces';
import {AnalysisService} from '../../services/analysis/analysis.service';
import {NetworkSettings} from '../../network-settings';
import { ActivatedRoute } from '@angular/router';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';

@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})
export class ExplorerPageComponent implements OnInit, AfterViewInit {

  public selectedCancerTypeComorbidityGraph: {data: any, layout: any};
  public analysisDialogTarget
  public visibleAnalysisTab: string | null = null;

  constructor(
    public analysis: AnalysisService,
    private route: ActivatedRoute,
    public explorerData: ExplorerDataService,
  ) {

    this.analysis.subscribeList((items, selected) => {
      if (this.explorerData.activeNetwork.nodeData.nodes === null || !this.explorerData.activeNetwork.nodeData.nodes.length) {
        return;
      }
      if (selected !== null) {
        if (items.length === 0) {
          return;
        }
        const updatedNodes = [];
        for (const item of items) {
          const node = this.explorerData.activeNetwork.nodeData.nodes.get(item.nodeId);
          if (!node) {
            continue;
          }
          const pos = this.explorerData.activeNetwork.networkVisJs.getPositions([item.nodeId]);
          node.x = pos[item.nodeId].x;
          node.y = pos[item.nodeId].y;

          Object.assign(node, NetworkSettings.getNodeStyle(
            node.wrapper.type,
            undefined,
            selected,
            undefined,
            undefined,
            node.gradient));
          updatedNodes.push(node);
        }
        this.explorerData.activeNetwork.nodeData.nodes.update(updatedNodes);
      } else {
        const updatedNodes = [];
        this.explorerData.activeNetwork.nodeData.nodes.forEach((node) => {
          const nodeSelected = this.analysis.idInSelection(node.id);
          Object.assign(node, NetworkSettings.getNodeStyle(
            node.wrapper.type,
            undefined,
            nodeSelected,
            undefined,
            undefined,
            node.gradient));
          updatedNodes.push(node);
        });
        this.explorerData.activeNetwork.nodeData.nodes.update(updatedNodes);
      }
    });
  }

  ngOnInit() {
    // init basic network with dummy
    this.explorerData.networks.basic = {cancerNodes: [], visibleEdges: []};
    this.explorerData.networks.analysis = {cancerNodes: []};

    this.route.queryParams.subscribe(async params => {
      this.explorerData.selectedAnalysisToken = params.task;
      if (!this.explorerData.networks.basic && this.explorerData.selectedAnalysisToken !== undefined) {
        this.explorerData.networks.basic = {cancerNodes: []};
        this.explorerData.activate('analysis');
      }
    });
  }

  async ngAfterViewInit() {
    /**
     * Initializes Explorer Page
     */
    if (!this.explorerData.activeNetwork) {
      // normal init
      this.explorerData.initBasicNetwork()
    }
  }

  public changeNetwork(networkType: NetworkType) {
    this.explorerData.activate(networkType);
  }

}
