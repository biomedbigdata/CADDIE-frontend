import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AnalysisService, algorithmNames } from '../../../../services/analysis/analysis.service';
import {
  Node,
  Task,
  CancerNode,
  Drug,
  Wrapper,
  WrapperType,
  getWrapperFromNode,
  getWrapperFromDrug,
  getWrapperFromCancerNode,
  getNodeIdsFromCancerDriverGeneDrugInteraction,
  getNodeIdsFromEdgeGene,
  getCancerDriverGeneNodeId,
  getGeneNodeId,
  ExpressionCancerType,
  Scored,
  Seeded,
  Baited,
  Tissue,
  DrugStatus, Dataset, MutationCancerType
} from '../../../../interfaces';
import { toast } from 'bulma-toast';
import { NetworkSettings } from '../../../../network-settings';
import { ControlService } from '../../../../services/control/control.service';
import { LoadingOverlayService } from '../../../../services/loading-overlay/loading-overlay.service';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';
import { PlotlyModule } from 'angular-plotly.js';

declare var vis: any;


@Component({
  selector: 'app-analysis-panel',
  templateUrl: './analysis-panel.component.html',
  styleUrls: ['./analysis-panel.component.scss'],
})
export class AnalysisPanelComponent implements OnInit, OnChanges {

  @Input() token: string | null = null;

  @Output() tokenChange = new EventEmitter<string | null>();
  @Output() showDetailsChange = new EventEmitter<Wrapper>();
  @Output() visibleItems = new EventEmitter<[any[], [Node[], CancerNode[], ExpressionCancerType]]>();
  @Output() visibleTab = new EventEmitter<string>();

  public task: Task = {
    token: '',
    info: {
      target: 'drug',
      algorithm: 'super',
      parameters: {},

      workerId: '',
      jobId: '',

      progress: 0,
      status: '',

      createdAt: '',
      startedAt: '',
      finishedAt: '',

      done: false,
      failed: false,
    },
    stats: {
      queuePosition: 0,
      queueLength: 0,
    }
  };

  public result: any = null;
  public drugCountBarplot: any = undefined;
  public geneCountBarplot: any = undefined;
  public nodeDegreeScatterplot: any = undefined;

  public tab: 'meta' | 'network' | 'table' | 'summary' = 'network';
  public physicsEnabled = true;
  public networkFullscreenStatus = false;

  public tableDrugs: Array<Drug & Scored & Baited> = [];
  public tableNodes: Array<Node & Scored & Seeded & Baited> = [];
  public tableSelectedNodes: Array<Node & Scored & Seeded & Baited> = [];
  public tableCancerNodes: Array<CancerNode & Scored & Seeded> = [];
  public tableSelectedCancerNodes: Array<CancerNode & Scored & Seeded> = [];
  public tableNormalize = false;
  public tableHasScores = false;

  public cancerExpressionExpanded = false;
  public expressionExpanded = false;

  public mutationExpanded = false;

  public algorithmNames = algorithmNames;

  public tableDrugScoreTooltip = '';
  public tableProteinScoreTooltip = '';

  public selectedTissue: Tissue | null = null;

  public isSeed = null;

  constructor(
    public analysis: AnalysisService,
    private control: ControlService,
    private loadingOverlay: LoadingOverlayService,
    public explorerData: ExplorerDataService
  ) {
  }

  async ngOnInit() {
  }

  async ngOAfterInit() {
    this.explorerData.activate('analysis');
  }

  async ngOnChanges(changes: SimpleChanges) {
    await this.refresh();
  }

  private async refresh() {
    /**
     * refreshes page in case task is completed
     */

    if (this.token) {

      this.task = await this.control.getTask(this.token);
      this.tab = (this.task && this.task.info.algorithm === 'summary') ? 'summary' : 'network';
      this.explorerData.activeNetwork.target = this.task.info.target;

      if (this.task.info.algorithm === 'degree') {
        this.tableDrugScoreTooltip =
          'Normalized number of direct interactions of the drug with the seeds. ' +
          'The higher the score, the more relevant the drug.';
        this.tableProteinScoreTooltip =
          'Normalized number of direct interactions of the protein with the seeds. ' +
          'The higher the score, the more relevant the protein.';
      } else if (this.task.info.algorithm === 'harmonic' || this.task.info.algorithm === 'quick' || this.task.info.algorithm === 'super') {
        this.tableDrugScoreTooltip =
          'Normalized inverse mean distance of the drug to the seeds. ' +
          'The higher the score, the more relevant the drug.';
        this.tableProteinScoreTooltip =
          'Normalized inverse mean distance of the protein to the seeds. ' +
          'The higher the score, the more relevant the protein.';
      } else if (this.task.info.algorithm === 'trustrank') {
        this.tableDrugScoreTooltip =
          'Amount of ‘trust’ on the drug at termination of the algorithm. ' +
          'The higher the score, the more relevant the drug.';
        this.tableProteinScoreTooltip =
          'Amount of ‘trust’ on the protein at termination of the algorithm. ' +
          'The higher the score, the more relevant the protein.';
      } else if (this.task.info.algorithm === 'proximity') {
        this.tableDrugScoreTooltip =
          'Empirical z-score of mean minimum distance between the drug’s targets and the seeds. ' +
          'The lower the score, the more relevant the drug.';
        this.tableProteinScoreTooltip =
          'Empirical z-score of mean minimum distance between the drug’s targets and the seeds. ' +
          'The lower the score, the more relevant the drug.';
      }

      if (this.task && this.task.info.done) {
        // reset potential old data
        this.drugCountBarplot = null;
        this.geneCountBarplot = null;
        this.nodeDegreeScatterplot = null;

        this.loadingOverlay.addTo('loadingOverlayTarget');
        this.result = await this.control.getTaskResult(this.token);
        // this.explorerData.activeNetwork.resetNetwork();

        this.explorerData.activate('analysis');
        this.loadNodeDataFromResult(this.result);

        this.explorerData.activeNetwork.showDrugs = false;

        await this.explorerData.activeNetwork.createNetwork();

        // const isBig = nodes.length > 200 || edges.length > 200;
        // const options = NetworkSettings.getOptions(isBig ? 'analysis-big' : 'analysis');
        // this.physicsEnabled = !isBig;

        this.explorerData.activeNetwork.networkVisJs.on('stabilizationIterationsDone', () => {
          this.explorerData.activeNetwork.updatePhysicsEnabled(false);
        });

        const promises: Promise<any>[] = [];
        promises.push(this.control.getTaskResultDrug(this.token)
          .then((table) => {
            this.tableDrugs = table;
            this.tableDrugs.forEach((drug) => {
              drug.rawScore = drug.score;
              drug.closestCancerGenes = (drug.closestCancerGenes as any).split(',');
            });
          }));
        promises.push(this.control.getTaskResultGene(this.token)
          .then((table) => {
            this.tableNodes = table;
            this.tableSelectedNodes = [];
            this.tableNodes.forEach((node) => {
              node.rawScore = node.score;
              node.rawMutationScore = node.mutationScore;
              node.isSeed = this.explorerData.activeNetwork.isSeed[node.graphId];
              node.closestCancerGenes = (node.closestCancerGenes as any).split(',');
              if (this.analysis.nodeInSelection(node)) {
                this.tableSelectedNodes.push(node);
              }
            });
          }));
        promises.push(this.control.getTaskResultCancerNode(this.token)
          .then((table) => {
            this.tableCancerNodes = table;
            this.tableCancerNodes.forEach((cancerDriverGene) => {
              cancerDriverGene.rawScore = cancerDriverGene.score;
              cancerDriverGene.rawMutationScore = cancerDriverGene.mutationScore;
              cancerDriverGene.isSeed = this.explorerData.activeNetwork.isSeed[cancerDriverGene.graphId];
            });
          }));
        await Promise.all(promises);

        this.tableHasScores = ['trustrank', 'harmonic', 'degree', 'proximity', 'betweenness', 'quick', 'super']
          .indexOf(this.task.info.algorithm) !== -1;
        if (this.tableHasScores) {
          if (this.task.info.algorithm !== 'proximity') {
            this.toggleNormalization(true);
          } else {
            this.toggleNormalization(false);
          }
        }

        this.explorerData.activeNetwork.networkVisJs.on('deselectNode', (properties) => {
          this.showDetailsChange.emit(null);
        });

        this.explorerData.activeNetwork.networkVisJs.on('doubleClick', (properties) => {
          const nodeIds: Array<string> = properties.nodes;
          if (nodeIds.length > 0) {
            const nodeId = nodeIds[0];
            const node = this.explorerData.activeNetwork.nodeData.nodes.get(nodeId);
            if (node.nodeType === 'drug') {
              return;
            }
            const wrapper = node.wrapper;
            if (this.analysis.inSelection(wrapper)) {
              this.analysis.removeItems([wrapper]);
              this.analysis.getCount();
            } else {
              this.analysis.addItems([wrapper]);
              this.analysis.getCount();
            }
          }
        });

        this.explorerData.activeNetwork.networkVisJs.on('click', async (properties) => {
          const selectedNodes = this.explorerData.activeNetwork.nodeData.nodes.get(properties.nodes);
          if (selectedNodes.length > 0) {
            const selectedNode = selectedNodes[0];
            const wrapper = selectedNode.wrapper;
            wrapper.comorbidities = await this.getComorbidities(wrapper);
            wrapper.cancerTypes = await this.getRelatedCancerTypes(wrapper);
            this.explorerData.nodeDegree = this.explorerData.activeNetwork.getNodeDegree(wrapper.data.graphId);
            this.showDetailsChange.emit(wrapper);
          } else {
            this.showDetailsChange.emit(null);
          }
        });

        this.analysis.subscribeList((items, selected) => {
          if (this.explorerData.activeNetwork.nodeData === undefined || !this.explorerData.activeNetwork.nodeData.nodes.length) {
            return;
          }
          if (selected !== null) {
            const updatedNodes = [];
            for (const item of items) {

              const node = this.explorerData.activeNetwork.nodeData.nodes.get(item.nodeId);
              if (!node) {
                continue;
              }
              let drugType;
              let isATCCLassL;
              if (item.type === 'Drug') {
                drugType = item.data.status;
                isATCCLassL = item.data.isAtcAntineoplasticAndImmunomodulatingAgent;
              }
              const pos = this.explorerData.activeNetwork.networkVisJs.getPositions([item.nodeId]);
              node.x = pos[item.nodeId].x;
              node.y = pos[item.nodeId].y;
              Object.assign(node, NetworkSettings.getNodeStyle(
                node.wrapper.type,
                node.isSeed,
                selected,
                drugType,
                isATCCLassL,
                node.gradient));
              updatedNodes.push(node);
            }
            this.explorerData.activeNetwork.nodeData.nodes.update(updatedNodes);

            const nodeSelection = this.tableSelectedNodes;
            const cancerNodesSelection = this.tableSelectedCancerNodes;
            for (const item of items) {
              if (item.type === 'Node') {
                // TODO: Refactor!
                const found = nodeSelection.findIndex((i) => getGeneNodeId(i) === item.nodeId);
                const tableItem = this.tableNodes.find((i) => getGeneNodeId(i) === item.nodeId);
                if (selected && found === -1 && tableItem) {
                  nodeSelection.push(tableItem);
                }
                if (!selected && found !== -1 && tableItem) {
                  nodeSelection.splice(found, 1);
                }
              } else if (item.type === 'CancerNode') {
                // TODO: Refactor!
                const found = cancerNodesSelection.findIndex((i) => getCancerDriverGeneNodeId(i) === item.nodeId);
                const tableItem = this.tableCancerNodes.find((i) => getCancerDriverGeneNodeId(i) === item.nodeId);
                if (selected && found === -1 && tableItem) {
                  cancerNodesSelection.push(tableItem);
                }
                if (!selected && found !== -1 && tableItem) {
                  cancerNodesSelection.splice(found, 1);
                }
              }
            }
            this.tableSelectedNodes = [...nodeSelection];
            this.tableSelectedCancerNodes = [...cancerNodesSelection];
          } else {
            const updatedNodes = [];
            this.explorerData.activeNetwork.nodeData.nodes.forEach((node) => {
              const nodeSelected = this.analysis.idInSelection(node.id);
              let drugType;
              let isATCClassL;
              if (node.wrapper.type === 'drug') {
                drugType = node.wrapper.data.status;
                isATCClassL = node.wrapper.data.isAtcAntineoplasticAndImmunomodulatingAgent;
              }
              Object.assign(node, NetworkSettings.getNodeStyle(
                node.wrapper.type,
                node.isSeed,
                nodeSelected,
                drugType,
                isATCClassL,
                node.gradient));
              updatedNodes.push(node);
            });
            this.explorerData.activeNetwork.nodeData.nodes.update(updatedNodes);

            const proteinSelection = [];
            const cancerGeneSelection = [];
            for (const item of items) {
              if (item.type === 'Node') {
                const tableItem = this.tableNodes.find((i) => getGeneNodeId(i) === item.nodeId);
                if (tableItem) {
                  proteinSelection.push(tableItem);
                }
              } else if (item.type === 'CancerNode') {
                const tableItem = this.tableCancerNodes.find((i) => getCancerDriverGeneNodeId(i) === item.nodeId);
                if (tableItem) {
                  cancerGeneSelection.push(tableItem);
                }
              }
            }
            this.tableSelectedNodes = [...proteinSelection];
            this.tableSelectedCancerNodes = [...cancerGeneSelection];
          }
        });
        if (this.result.drugCounts !== undefined) {
          // load summary graphs
          this.loadDrugCountBarplot();
          this.loadGeneCountBarplot();
        }
        if (this.result.tracesDegree !== undefined) {
          this.loadNodeDegreeScatterplot();
        }
        this.loadingOverlay.removeFrom('loadingOverlayTarget');
      }
    }
    // this.emitVisibleItems(true);
  }

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
    return `${environment.backend}task_result/?token=${this.token}&view=${view}&fmt=csv`;
  }

  public graphmlLink(): string {
    return `${environment.backend}graph_export/?token=${this.token}`;
  }

  public print(x) {
    console.log(x)
  }

  public loadNodeDataFromResult(result: any) {
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
    this.explorerData.activeNetwork.degrees = result.nodeAttributes.degrees || {};
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
      nodes.push(this.explorerData.activeNetwork.mapNode(nodeTypes[node], details[node], isSeed[node], scores[node]));
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
    this.explorerData.activeNetwork.networkData = { cancerNodes, otherNodes };
  }

  // public selectTissue(tissue: Tissue | null) {
  //   /**
  //    * Handle tissue button and fetch data based on tissue + manage expression data
  //    */
  //   // remove potential mutation gradient selection
  //   this.selectedExpressionCancerType = null;
  //   this.selectedMutationCancerType = null;
  //   this.expressionExpanded = false;
  //   this.cancerExpressionExpanded = false;
  //   this.mutationExpanded = false;

  //   if (!tissue) {
  //     // if no tissue selected, we reset all nodes in network
  //     this.explorerData.activeNetwork.selectedTissue = null;
  //     // reset each normal genes and cancer genes
  //     const updatedNodes = [
  //       ...this._resetNetworkColorGradient('Node'),
  //       ...this._resetNetworkColorGradient('CancerNode')
  //     ];
  //     this.explorerData.activeNetwork.nodeData.nodes.update(updatedNodes);

  //   } else {
  //     // ELSE tissue is selected, fetch data based on min expression value
  //     this.explorerData.activeNetwork.selectedTissue = tissue;

  //     const minExp = 0.3;

  //     // fetch all data
  //     this.control.tissueExpressionGenes(tissue, this.explorerData.activeNetwork.basicNodes, this.explorerData.activeNetwork.cancerNodes)
  //       .subscribe((response) => {
  //         // response is object with key "cancerGenes" and "genes"
  //         // each which is list of objects with "gene" and "level" (expression value)
  //         const maxExpr = Math.max(...[...response.genes, ...response.cancerGenes].map(lvl => lvl.level));

  //         // fetch each normal genes and cancer genes
  //         const updatedGenes = this._interpretTissueExpressionResponse(
  //           response.genes, maxExpr, minExp, 'Node'
  //         );
  //         const updatedCancerGenes = this._interpretTissueExpressionResponse(
  //           response.cancerGenes, maxExpr, minExp, 'CancerNode'
  //         );

  //         const updatedNodes = [...updatedGenes, ...updatedCancerGenes];
  //         this.explorerData.activeNetwork.nodeData.nodes.update(updatedNodes);
  //       });
  //   }
  // }

  // private _interpretTissueExpressionResponse(
  //   /**
  //    * Reads the result of the "TissueExpressionView" and converts it into input for the network
  //    * Main function is to calculate the color gradient based on expression value
  //    * We have to differentiate between Node and CancerNode to not mix up the types in the network
  //    */
  //   geneList: { gene: (Node | CancerNode), level: number }[],
  //   maxExpr: number,
  //   minExp: number,
  //   nodeType: ('Node' | 'CancerNode')
  // ): Node[] {
  //   const updatedNodes = [];
  //   for (const lvl of geneList) {
  //     let item;
  //     let nodes;
  //     if (nodeType === 'Node') {
  //       item = getWrapperFromNode(lvl.gene as Node);
  //       nodes = this.explorerData.activeNetwork.basicNodes;
  //     } else {
  //       item = getWrapperFromCancerNode(lvl.gene as CancerNode);
  //       nodes = this.explorerData.activeNetwork.cancerNodes;
  //     }

  //     const node = this.explorerData.activeNetwork.nodeData.nodes.get(item.nodeId);
  //     if (!node) {
  //       continue;
  //     }
  //     // calculate color gradient
  //     const gradient = lvl.level !== null ? (Math.pow(lvl.level / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
  //     const pos = this.network.getPositions([item.nodeId]);
  //     node.x = pos[item.nodeId].x;
  //     node.y = pos[item.nodeId].y;
  //     Object.assign(node,
  //       NetworkSettings.getNodeStyle(
  //         node.wrapper.type,
  //         node.isSeed,
  //         this.analysis.inSelection(item),
  //         undefined,
  //         undefined,
  //         gradient));
  //     node.wrapper = item;
  //     node.gradient = gradient;
  //     nodes.find(gene => getGeneNodeId(gene) === item.nodeId).expressionLevel = lvl.level;
  //     (node.wrapper.data as (Node | CancerNode)).expressionLevel = lvl.level;
  //     updatedNodes.push(node);
  //   }
  //   return updatedNodes;
  // }

  private async getRelatedCancerTypes(item: Wrapper) {
    const dataset: Dataset = this.result.cancerDataset;
    const data = await this.control.getRelatedCancerTypes(dataset, item.data);
    return data.cancerTypes;
  }

  private async getComorbidities(item: Wrapper) {
    const data = await this.control.getComorbidities(item.data);
    return data.interactions;
  }

  private _resetNetworkColorGradient(nodeType: ('Node' | 'CancerNode')): Node[] {
    /**
     * resets the color gradient from expressionCancerType expression to normal network colors
     * We have to differentiate between Nodes and CancerNodes to not mix up the types in the network
     */
    const updatedNodes = [];
    let nodes;
    if (nodeType === 'Node') {
      nodes = this.explorerData.activeNetwork.basicNodes;
    } else {
      nodes = this.explorerData.activeNetwork.cancerNodes;
    }
    for (const gene of nodes) {
      let item;
      if (nodeType === 'Node') {
        item = getWrapperFromNode(gene as Node);
      } else {
        item = getWrapperFromCancerNode(gene as CancerNode);
      }

      const node = this.explorerData.activeNetwork.nodeData.nodes.get(item.nodeId);
      if (!node) {
        continue;
      }
      const pos = this.explorerData.activeNetwork.networkVisJs.getPositions([item.nodeId]);
      node.x = pos[item.nodeId].x;
      node.y = pos[item.nodeId].y;
      Object.assign(node,
        NetworkSettings.getNodeStyle(
          node.wrapper.type,
          node.isSeed,
          this.analysis.inSelection(item),
          undefined,
          undefined,
          1.0));
      node.wrapper = item;
      node.gradient = 1.0;
      gene.expressionLevel = undefined;
      (node.wrapper.data as Node).expressionLevel = undefined;
      gene.expressionLevelScore = undefined;
      (node.wrapper.data as Node).expressionLevelScore = undefined;
      updatedNodes.push(node);
    }
    return updatedNodes;
  }

  private _interpretGeneMutations(
    /**
     * Reads the nMutations of each gene and applies the color gradient
     */
    geneList: (Node | CancerNode)[],
    maxCount: number,
    minCount: number,
    nodeType: ('Node' | 'CancerNode')
  ): Node[] {
    const updatedNodes = [];

    for (const n of geneList) {
      let item;
      if (nodeType === 'Node') {
        item = getWrapperFromNode(n as Node);
      } else {
        item = getWrapperFromCancerNode(n as CancerNode);
      }

      const node = this.explorerData.activeNetwork.nodeData.nodes.get(item.nodeId);
      if (!node) {
        continue;
      }
      // calculate color gradient
      const gradient = n.mutationCounts !== null ? (Math.pow(n.mutationCounts / maxCount, 1 / 3)) : -1;
      const pos = this.explorerData.activeNetwork.networkVisJs.getPositions([item.nodeId]);
      node.x = pos[item.nodeId].x;
      node.y = pos[item.nodeId].y;
      Object.assign(node,
        NetworkSettings.getNodeStyle(
          node.wrapper.type,
          node.isSeed,
          this.analysis.inSelection(item),
          undefined,
          undefined,
          gradient));
      node.wrapper = item;
      node.gradient = gradient;
      updatedNodes.push(node);
    }
    return updatedNodes;
  }

  // public updatePhysicsEnabled(bool: boolean) {
  //   /**
  //    * Controls the physics enabled button in the analysis network
  //    */
  //   this.physicsEnabled = bool;
  //   this.network.setOptions({
  //     physics: {
  //       enabled: this.physicsEnabled,
  //       stabilization: {
  //         enabled: false,
  //       },
  //     }
  //   });
  // }

  public tableGeneSelection(e) {
    /**
     * Manages the Gene Table in the Analysis section
     *
     * Adds and remove Genes based on user selected genes via addItems() and removeItems()
     */
    const oldSelection = [...this.tableSelectedNodes];

    this.tableSelectedNodes = e;
    const addItems = [];
    const removeItems = [];

    for (const i of this.tableSelectedNodes) {
      const wrapper = getWrapperFromNode(i);
      if (oldSelection.indexOf(i) === -1) {
        addItems.push(wrapper);
      }
    }

    for (const i of oldSelection) {
      const wrapper = getWrapperFromNode(i);
      if (this.tableSelectedNodes.indexOf(i) === -1) {
        removeItems.push(wrapper);
      }
    }

    this.analysis.addItems(addItems);
    this.analysis.removeItems(removeItems);
  }

  public tableCancerDriverGeneSelection(e) {
    /**
     * Manages the CancerDriverGene Table in the Analysis section
     *
     * Adds and remove Genes based on user selected genes via addItems() and removeItems()
     */
    const oldSelection = [...this.tableSelectedCancerNodes];
    this.tableSelectedCancerNodes = e;
    const addItems = [];
    const removeItems = [];
    for (const i of this.tableSelectedCancerNodes) {
      const wrapper = getWrapperFromCancerNode(i);
      if (oldSelection.indexOf(i) === -1) {
        addItems.push(wrapper);
      }
    }
    for (const i of oldSelection) {
      const wrapper = getWrapperFromCancerNode(i);
      if (this.tableSelectedCancerNodes.indexOf(i) === -1) {
        removeItems.push(wrapper);
      }
    }
    this.analysis.addItems(addItems);
    this.analysis.removeItems(removeItems);
  }

  public previewStringArray(arr: string[], count: number): string {
    if (arr.length < count) {
      return arr.join(', ');
    } else {
      return arr.slice(0, count).join(', ') + `, ... (${arr.length})`;
    }
  }

  public async colorMutationGradient(mutationCancerType: MutationCancerType | null) {
    /**
     * Handle mutation button and colors the node based on nMutations
     */

    // remove potential expressionCancerType selection
    this.explorerData.activeNetwork.selectedExpressionCancerType = null;
    this.cancerExpressionExpanded = false;
    this.expressionExpanded = false;
    this.mutationExpanded = false;
    this.explorerData.activeNetwork.selectedTissue = null;

    if (!mutationCancerType) {
      this.explorerData.activeNetwork.selectedMutationCancerType = null;
      // if user deactivated mutation color gradient, we reset all nodes in network
      // reset each normal genes and cancer genes
      const updatedNodes = [
        ...this._resetNetworkColorGradient('Node'),
        ...this._resetNetworkColorGradient('CancerNode')
      ];
      this.explorerData.activeNetwork.nodeData.nodes.update(updatedNodes);

    } else {
      this.explorerData.activeNetwork.selectedMutationCancerType = mutationCancerType;
      // else gradient is activated, color nodes
      const mutationsCounts = [];

      // fetch all data
      const response = await this.control.mutationScores(
        mutationCancerType, this.explorerData.activeNetwork.basicNodes, this.explorerData.activeNetwork.cancerNodes);
      for (const node of [...response.nodes, ...response.cancerNodes]) {
        if (node.nMutations !== null) {
          mutationsCounts.push(node.mutationCounts);
        }
      }
      const maxCount = Math.max(...mutationsCounts);
      const minCount = Math.min(...mutationsCounts);

      const updatedGenes = this._interpretGeneMutations(response.nodes, maxCount, minCount, 'Node');
      const updatedCancerGenes = this._interpretGeneMutations(response.cancerNodes, maxCount, minCount, 'CancerNode');

      const updatedNodes = [...updatedGenes, ...updatedCancerGenes];
      this.explorerData.activeNetwork.nodeData.nodes.update(updatedNodes);
    }
  }

  public selectExpressionCancerType(expressionCancerType: ExpressionCancerType | null) {
    /**
     * Handle expressionCancerType button and fetch data based on expressionCancerType + manage expression data
     */
    // remove potential mutation gradient selection
    this.explorerData.activeNetwork.selectedMutationCancerType = null;
    this.cancerExpressionExpanded = false;
    this.expressionExpanded = false;
    this.mutationExpanded = false;
    this.explorerData.activeNetwork.selectedTissue = null;

    if (!expressionCancerType) {
      // if no expressionCancerType selected, we reset all nodes in network
      this.explorerData.activeNetwork.selectedExpressionCancerType = null;
      // reset each normal genes and cancer genes
      const updatedNodes = [
        ...this._resetNetworkColorGradient('Node'),
        ...this._resetNetworkColorGradient('CancerNode')
      ];
      this.explorerData.activeNetwork.nodeData.nodes.update(updatedNodes);

    } else {
      // ELSE expressionCancerType is selected, fetch data based on min expression value
      this.explorerData.activeNetwork.selectedExpressionCancerType = expressionCancerType;

      const minExp = 0.3;

      // fetch all data
      this.control.expressionCancerTypeExpressionGenes(
        expressionCancerType, this.explorerData.activeNetwork.basicNodes, this.explorerData.activeNetwork.cancerNodes)
        .subscribe((response) => {
          // response is object with key "cancerGenes" and "genes"
          // each which is list of objects with "gene" and "level" (expression value)
          const maxExpr = Math.max(...[...response.genes, ...response.cancerGenes].map(lvl => lvl.level));

          // fetch each normal genes and cancer genes
          const updatedGenes = this._interpretExpressionCancerTypeExpressionResponse(
            response.genes, maxExpr, minExp, 'Node'
          );
          const updatedCancerGenes = this._interpretExpressionCancerTypeExpressionResponse(
            response.cancerGenes, maxExpr, minExp, 'CancerNode'
          );

          const updatedNodes = [...updatedGenes, ...updatedCancerGenes];
          this.explorerData.activeNetwork.nodeData.nodes.update(updatedNodes);
        });
    }
  }

  private _interpretExpressionCancerTypeExpressionResponse(
    /**
     * Reads the result of the "ExpressionCancerTypeExpressionView" and converts it into input for the network
     * Main function is to calculate the color gradient based on expression value
     * We have to differentiate between Node and CancerNode to not mix up the types in the network
     */
    geneList: { gene: (Node | CancerNode), level: number }[],
    maxExpr: number,
    minExp: number,
    nodeType: ('Node' | 'CancerNode')
  ): Node[] {
    const updatedNodes = [];
    for (const lvl of geneList) {
      let item;
      let nodes;
      if (nodeType === 'Node') {
        item = getWrapperFromNode(lvl.gene as Node);
        nodes = this.explorerData.activeNetwork.basicNodes;
      } else {
        item = getWrapperFromCancerNode(lvl.gene as CancerNode);
        nodes = this.explorerData.activeNetwork.cancerNodes;
      }

      const node = this.explorerData.activeNetwork.nodeData.nodes.get(item.nodeId);
      if (!node) {
        continue;
      }
      // calculate color gradient
      const gradient = lvl.level !== null ? (Math.pow(lvl.level / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
      const pos = this.explorerData.activeNetwork.networkVisJs.getPositions([item.nodeId]);
      node.x = pos[item.nodeId].x;
      node.y = pos[item.nodeId].y;
      Object.assign(node,
        NetworkSettings.getNodeStyle(
          node.wrapper.type,
          node.isSeed,
          this.analysis.inSelection(item),
          undefined,
          undefined,
          gradient));
      node.wrapper = item;
      node.gradient = gradient;
      nodes.find(gene => getGeneNodeId(gene) === item.nodeId).expressionLevelScore = lvl.level;
      (node.wrapper.data as (Node | CancerNode)).expressionLevelScore = lvl.level;
      updatedNodes.push(node);
    }
    return updatedNodes;
  }

  public formatStringList(stingList) {
    return stingList.join(', ');
  }

  public nodeColorPlots = {
    Gene: '#143d1f',
    'Cancer Gene': '#5b005b',
    Drug: '#0080ff'
  }

  public toggleSeedFromScatterplot(data) {
    // const pn = data.points[0].pointNumber;
    // const tn = data.points[0].curveNumber;
    // console.log(tn)
    // const colors = [data.points[0].data.marker.color];
    // const update = {'marker': {
    //   color: data.points[0].data.marker.color,
    //   size: data.points[0].data.marker.size,
    //   line: {color: '#ffa500', width: 2}}};
    // var pn='',
    //     tn='',
    //     colors = [],
    //     lines=[];
    // for(var i=0; i < data.points.length; i++){
    //   pn = data.points[i].pointNumber;
    //   tn = data.points[i].curveNumber;
    //   colors = data.points[i].data.marker.color;
    //   lines = data.points[i].data.marker.line;
    // };
    // data.points[0].data.marker.color[data.points[0].pointNumber] = NetworkSettings.selectedBorderColor;

    // this.nodeDegreeScatterplot.data[1].marker.color[data.points[0].pointNumber] = NetworkSettings.selectedBorderColor;
    // this.nodeDegreeScatterplot = { ...this.nodeDegreeScatterplot };


    const colors = data.points[0].data.marker.color;
    // const lines = data.points[0].data.marker.line;
    colors[data.points[0].pointNumber] = NetworkSettings.selectedBorderColor;
    // lines[data.points[0].pointNumber] = [{color: 'red', width: 5}];
    const update = { marker: { color: colors, size: 12 } };
    PlotlyModule.plotlyjs.restyle('nodeDegreePlot', update, [data.points[0].curveNumber]);
    // const update = {'marker': {color: colors, line: lines, size: 12}};
    // PlotlyModule.plotlyjs.restyle('nodeDegreePlot', update, [tn]);
  }

  public toggleSeedFromBarplot(data) {
    // console.log(data.points[0].x)
    let targetNode;
    this.explorerData.activeNetwork.nodes.forEach((node) => {
      if (node.label === data.points[0].x) {
        targetNode = node;
      }
    });
    if (this.analysis.inSelection(targetNode.wrapper)) {
      this.analysis.removeSeeds([targetNode]);
    } else {
      this.analysis.addSeeds([targetNode]);
    }
  }

  public async loadGeneCountBarplot() {
    const plotWidth = Object.keys(this.result.geneCounts).length * 30;
    this.geneCountBarplot = {
      data: [
        {
          x: Object.keys(this.result.geneCounts),
          y: Object.values(this.result.geneCounts),
          type: 'bar',
          name: 'Gene',
          transforms: [{
            type: 'sort',
            target: 'y',
            order: 'descending'
          }],
          marker: {
            color: '#143d1f'
          }
        },
        {
          x: Object.keys(this.result.cancerGeneCounts),
          y: Object.values(this.result.cancerGeneCounts),
          type: 'bar',
          name: 'Cancer Gene',
          transforms: [{
            type: 'sort',
            target: 'y',
            order: 'descending'
          }],
          marker: {
            color: '#5b005b',
            line: {
              color: '#ffa500',
            }
          },
        },
      ],

      layout: {
        title: {
          text: `Gene Counts`,
          x: 0,
          xanchor: 'left',
          pad: {
            l: 80
          }
        },
        width: plotWidth,
        xaxis: {
          title: 'Gene Names',
          automargin: true,
          rangeslider: { visible: false },
        },
        yaxis: {
          title: 'Occurrences',
          automargin: true
        },
        showlegend: true,
        legend: {
          x: 0,
          xanchor: 'right',
          y: 1,
          font: {
            size: 12,
          },
          // orientation: "h"
        }
      },
      config: {
        responsive: true
      }
    };
  }

  public async loadDrugCountBarplot() {
    if (!this.result.drugCounts || !Object.keys(this.result.drugCounts).length) {
      return
    }
    const plotWidth = Object.keys(this.result.drugCounts).length * 40;
    this.drugCountBarplot = {
      data: [
        {
          x: Object.keys(this.result.drugCounts),
          y: Object.values(this.result.drugCounts),
          type: 'bar',
          transforms: [{
            type: 'sort',
            target: 'y',
            order: 'descending'
          }],
          marker: {
            title: 'Counts',
            color: '#0080ff'
          }
        },
      ],

      layout: {
        width: plotWidth,
        title: {
          text: `Drug Counts`,
          x: 0,
          xanchor: 'left',
          pad: {
            l: 80
          }
        },
        xaxis: {
          title: 'Drug Names',
          automargin: true,
        },
        yaxis: {
          title: 'Occurrences',
          automargin: true
        },
        legend: {
          x: 0,
          y: 1,
          font: {
            size: 12,
          }
        }
      },
      config: {
        responsive: true
      }
    };
  }

  public async loadNodeDegreeScatterplot() {
    if (!(this.result.tracesDegree.Node.x.length || this.result.tracesDegree.CancerNode.x.length || this.result.tracesDegree.Drug.x.length)) {
      return
    }
    const maxScoreGenes = Math.max(...[...this.result.tracesDegree.Node.y, ...this.result.tracesDegree.CancerNode.y])
    const colorsGene = []; for (let i = 0; i < this.result.tracesDegree.Node.x.length; i++) { colorsGene.push(NetworkSettings.node) };
    const linesGene = []; for (let i = 0; i < this.result.tracesDegree.Node.x.length; i++) { linesGene.push({ color: NetworkSettings.selectedBorderColor, width: 0 }) };
    const colorsCancerGene = []; for (let i = 0; i < this.result.tracesDegree.CancerNode.x.length; i++) { colorsCancerGene.push(NetworkSettings.cancerNode) };
    const linesCancerGene = []; for (let i = 0; i < this.result.tracesDegree.CancerNode.x.length; i++) { linesCancerGene.push({ color: NetworkSettings.selectedBorderColor, width: 0 }) };

    this.nodeDegreeScatterplot = {
      data: [
        {
          x: this.result.tracesDegree.Drug.x,
          y: this.result.tracesDegree.Drug.y.map(v => v / Math.max(...this.result.tracesDegree.Drug.y)),
          mode: 'markers',
          type: 'scatter',
          name: 'Drug',
          text: this.result.tracesDegree.Drug.names,
          marker: {
            size: 12,
            color: NetworkSettings.approvedDrugColor,
            line: { color: NetworkSettings.selectedBorderColor, width: 0 }
          }
        },
        {
          x: this.result.tracesDegree.Node.x,
          y: this.result.tracesDegree.Node.y.map(v => v / maxScoreGenes), //  Math.max(...this.result.tracesDegree.Node.y)),
          mode: 'markers',
          type: 'scatter',
          name: 'Gene',
          text: this.result.tracesDegree.Node.names,
          marker: { size: 12, color: colorsGene, line: linesGene }
        },
        {
          x: this.result.tracesDegree.CancerNode.x,
          y: this.result.tracesDegree.CancerNode.y.map(v => v / maxScoreGenes), //  Math.max(...this.result.tracesDegree.CancerNode.y)),
          mode: 'markers',
          type: 'scatter',
          name: 'Cancer Gene',
          text: this.result.tracesDegree.CancerNode.names,
          marker: { size: 12, color: colorsCancerGene, line: linesCancerGene }
        }
      ],

      layout: {
        title: {
          text: `CADDIE score vs. Interactome Degree`,
          x: 0,
          xanchor: 'left',
          pad: {
            l: 80
          }
        },
        xaxis: {
          title: 'Interactome Degree',
          automargin: true,
        },
        yaxis: {
          title: 'Score (Normalized)',
          automargin: true
        },
        legend: {
          x: 1,
          y: 1,
          xanchor: 'right',
          font: {
            size: 12,
          }
        }
      },
      config: {
        responsive: true
      }
    };
  }

}


