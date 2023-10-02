import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Baited, CancerNode, CancerType, Dataset, Drug, Node, Scored, Seeded, Task, Wrapper, getNodeIdsFromEdgeGene, getWrapperFromCancerNode, getWrapperFromDrug, getWrapperFromNode } from 'src/app/interfaces';
import { NetworkSettings } from 'src/app/network-settings';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { ControlService } from 'src/app/services/control/control.service';
import { environment } from 'src/environments/environment';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';

declare var vis: any;

@Component({
  selector: 'app-simple-explorer-page',
  templateUrl: './simple-explorer-page.component.html',
  styleUrls: ['./simple-explorer-page.component.scss']
})
export class SimpleExplorerPageComponent implements OnInit {

  MAX_TASKS = 3;

  constructor(
    public analysis: AnalysisService, 
    public backend: ControlService,
    public explorerData: ExplorerDataService, 
    private route: ActivatedRoute,
    private control: ControlService
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

  public dataset: Dataset = {
    "backendId": 1,
    "name": "NCG6",
    "link": "http://ncg.kcl.ac.uk/",
    "version": "1",
    "count": 2088
  }
  public interactionGeneDataset: Dataset = {
    backendId: 5,
    name: "HTRIdb",
    link: "http://www.lbbc.ibb.unesp.br/htri/index.jsp",
    version: "2020-11-20",
    count: 38761
  }
  public interactionDrugDataset: Dataset = {
    backendId: 4,
    name: "DGIdb",
    link: "https://www.dgidb.org/",
    version: "4.2.0",
    count: 26201
  }
  public cancerTypes: CancerType[] = [];
  public cancerType: CancerType = {
    "backendId": 6,
    "name": "diffuse intrinsic pontine glioma"
  }

  public showResultModal = false;

  async ngOnInit() {

    const cancerTypes = await this.backend.getCancerTypes(this.dataset);
    this.explorerData.cancerTypes = cancerTypes;
    // add a "custom" cancer type
    // this.cancerTypes = [this.cancerType, ...cancerTypes];
    this.cancerTypes = cancerTypes;

    this.explorerData.networks['simple'].selectedDataset = this.dataset;
    this.explorerData.networks['simple'].selectedInteractionGeneDataset = this.interactionGeneDataset;
    this.explorerData.networks['simple'].selectedInteractionDrugDataset = this.interactionDrugDataset;
    this.explorerData.networks['simple'].selectedCancerTypeItems = [this.cancerType];

    this.explorerData.activate('simple');
  }

  public selectCancerType(cancerType: CancerType) {
    if (cancerType.backendId === -1) {
      return
    }

    console.log(cancerType)
  }

  public closeResultModal() {
    this.selectedAnalysisToken = null;
    this.task = null;
    this.result = null;
    this.tab = 'network';
    this.tableHasScores = true;
    this.tableNormalize = true;
    this.showResultModal = false;
    this.explorerData.activate('simple');
  }


  public formatStringList(stingList) {
    return stingList.join(', ');
  }


  public selectedAnalysisToken = null;
  public task = null;
  public result = null;
  public tab = 'network';
  public tableHasScores = true;
  public tableNormalize = true;
  public async openSimpleAnalysis(token) {
    /**
     * opens analysis modal
    */
    if (this.selectedAnalysisToken !== null) {
      // in case user jumps from one analysis to another, close previous analysis before opening new one.
      // This resets variables and enables a clean slate.
      this.selectedAnalysisToken = null;
    }
    // update the selectedAnalysisToken which will open the analysis panel
    this.selectedAnalysisToken = token;

    this.task = await this.control.getTask(token);
    this.result = await this.control.getTaskResult(token)

    this.explorerData.activate('simpleAnalysis');

    this.loadNodeDataFromResult(this.result);

    const promises: Promise<any>[] = [];
    promises.push(this.control.getTaskResultDrug(token)
      .then((table) => {
        this.tableDrugs = table;
        this.tableDrugs.forEach((drug) => {
          drug.rawScore = drug.score;
          drug.closestCancerGenes = (drug.closestCancerGenes as any).split(',');
          drug.dbDegree = this.explorerData.activeNetwork.degrees[drug.graphId];
        });
      }));
    promises.push(this.control.getTaskResultGene(token)
      .then((table) => {
        this.tableNodes = table;
        this.tableSelectedNodes = [];
        this.tableNodes.forEach((node: any) => {
          node.rawScore = node.score;
          node.rawMutationScore = node.mutationScore;
          node.isSeed = this.explorerData.activeNetwork.isSeed[node.graphId];
          node.dbDegree = this.explorerData.activeNetwork.degrees[node.graphId];
          if (this.analysis.nodeInSelection(node)) {
            this.tableSelectedNodes.push(node);
          }
        });
      }));
    promises.push(this.control.getTaskResultCancerNode(token)
      .then((table) => {
        this.tableCancerNodes = table;
        this.tableCancerNodes.forEach((cancerDriverGene) => {
          cancerDriverGene.rawScore = cancerDriverGene.score;
          cancerDriverGene.rawMutationScore = cancerDriverGene.mutationScore;
          cancerDriverGene.isSeed = this.explorerData.activeNetwork.isSeed[cancerDriverGene.graphId];
          cancerDriverGene.dbDegree = this.explorerData.activeNetwork.degrees[cancerDriverGene.graphId];
        });
      }));
    await Promise.all(promises);

    this.toggleNormalization(true);

    await this.explorerData.activeNetwork.createNetwork();

    this.explorerData.activeNetwork.networkVisJs.on('stabilizationIterationsDone', () => {
      this.explorerData.activeNetwork.updatePhysicsEnabled(false);
    });

    // open modal
    this.showResultModal = true;
  }

  public tableDrugs: Array<Drug & Scored & Baited> = [];
  public tableNodes: Array<Node & Scored & Seeded & Baited> = [];
  public tableSelectedNodes: Array<Node & Scored & Seeded & Baited> = [];
  public tableCancerNodes: Array<CancerNode & Scored & Seeded> = [];
  public tableSelectedCancerNodes: Array<CancerNode & Scored & Seeded> = [];
  public toggleNormalization(normalize: boolean) {
    /**
     * toggles normalization in analysis table
     */

    const capitalizeFirstLetter = (s: string) => {
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    this.tableNormalize = normalize;

    const normalizeFn = (table, key: string) => {
      const rawKey = `raw${capitalizeFirstLetter(key)}`;
      let max = 0;
      // get maximum
      table.forEach(i => {
        if (i[rawKey] > max) {
          max = i[rawKey];
        }
      });
      // set normalized score
      table.forEach(i => {
        i[key] = i[rawKey] / max;
      });
    };

    const unnormalizeFn = (table, key: string) => {
      const rawKey = `raw${capitalizeFirstLetter(key)}`;
      // reset normalized score
      table.forEach(i => {
        i[key] = i[rawKey];
      });
    };

    if (normalize) {
      normalizeFn(this.tableDrugs, 'score');
      normalizeFn(this.tableNodes, 'score');
      normalizeFn(this.tableCancerNodes, 'score');
      normalizeFn(this.tableNodes, 'mutationScore');
      normalizeFn(this.tableCancerNodes, 'mutationScore');
    } else {
      unnormalizeFn(this.tableDrugs, 'score');
      unnormalizeFn(this.tableNodes, 'score');
      unnormalizeFn(this.tableCancerNodes, 'score');
      unnormalizeFn(this.tableNodes, 'mutationScore');
      unnormalizeFn(this.tableCancerNodes, 'mutationScore');
    }
  }


  public downloadLink(view: string): string {
    return `${environment.backend}task_result/?token=${this.selectedAnalysisToken}&view=${view}&fmt=csv`;
  }

  public graphmlLink(): string {
    return `${environment.backend}graph_export/?token=${this.selectedAnalysisToken}`;
  }

  public async loadNodeDataFromResult(result: any) {
    const nodes = [];
    const edges = [];
    this.explorerData.activeNetwork.selectedDataset = result.cancerDataset;
    this.explorerData.activeNetwork.selectedInteractionGeneDataset = result.geneInteractionDataset;
    this.explorerData.activeNetwork.selectedInteractionDrugDataset = result.drugInteractionDataset;
    this.explorerData.activeNetwork.selectedCancerTypeItems = result.cancerTypes;

    this.explorerData.activeNetwork.basicNodes = [];
    this.explorerData.activeNetwork.cancerNodes = [];
    this.explorerData.activeNetwork.drugNodes = [];
    const network = result.network;
    const isSeed: { [key: string]: boolean } = result.nodeAttributes.isSeed || {};
    const degrees = result.nodeAttributes.dbDegrees || {};
    this.explorerData.activeNetwork.degrees = result.nodeAttributes.dbDegrees || {};
    const nodeTypes = result.nodeAttributes.nodeTypes || {};
    const scores = result.nodeAttributes.scores || {};
    const details = result.nodeAttributes.details || {};
    const wrappers: { [key: string]: Wrapper } = {};
    for (const node of network.nodes) {
      if (nodeTypes[node] === 'Node') {
        this.explorerData.activeNetwork.basicNodes.push(details[node]);
        wrappers[node] = getWrapperFromNode(details[node]);
      } else if (nodeTypes[node] === 'CancerNode') {
        this.explorerData.activeNetwork.cancerNodes.push(details[node]);
        wrappers[node] = getWrapperFromCancerNode(details[node]);
      } else if (nodeTypes[node] === 'Drug') {
        wrappers[node] = getWrapperFromDrug(details[node]);
        this.explorerData.activeNetwork.drugNodes.push(details[node]);
      }
      nodes.push(this.explorerData.activeNetwork.mapNode(nodeTypes[node], details[node], isSeed[node], scores[node], degrees[node]));
    }
    for (const edge of network.edges) {
      edges.push(this.explorerData.activeNetwork.mapEdge(edge, 'node-node', wrappers));
    }
    this.explorerData.activeNetwork.nodeData = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
    this.explorerData.activeNetwork.isSeed = isSeed;

    // create interactions lists, needed for node filtering in network
    for (const value of Object.values(wrappers)) {
      value.data.interactions = [];
    }
    for (const edge of network.edges) {
      const { from, to } = getNodeIdsFromEdgeGene(edge, wrappers);
      wrappers[from].data.interactions.push(to);
      wrappers[from].data.interactions.push(from);
    }
    const cancerNodes = [];
    const otherNodes = [];  // basic nodes and drugs
    for (const value of Object.values(wrappers)) {
      value.type === 'CancerNode' ? cancerNodes.push(value.data) : otherNodes.push(value.data);
    }
    // set needed activeNetowrk properties
    this.explorerData.activeNetwork.cancerNodesSup = [];
    this.explorerData.activeNetwork.networkData = { cancerNodes: cancerNodes, nodes: otherNodes };

  }


}
