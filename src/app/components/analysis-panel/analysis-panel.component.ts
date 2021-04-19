import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {AnalysisService, algorithmNames} from '../../services/analysis/analysis.service';
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
  Tissue,
  Scored,
  Seeded,
  Baited,
  DrugStatus, Dataset, MutationCancerType
} from '../../interfaces';
import html2canvas from 'html2canvas';
import {toast} from 'bulma-toast';
import {NetworkSettings} from '../../network-settings';
import {ControlService} from '../../services/control/control.service';
import {LoadingOverlayService} from '../../services/loading-overlay/loading-overlay.service';
import {ActivatedRoute, Router} from '@angular/router';

declare var vis: any;


@Component({
  selector: 'app-analysis-panel',
  templateUrl: './analysis-panel.component.html',
  styleUrls: ['./analysis-panel.component.scss'],
})
export class AnalysisPanelComponent implements OnInit, OnChanges {

  @ViewChild('network', {static: false}) networkEl: ElementRef;

  @Input() token: string | null = null;

  @Output() tokenChange = new EventEmitter<string | null>();
  @Output() showDetailsChange = new EventEmitter<Wrapper>();
  @Output() visibleItems = new EventEmitter<[any[], [Node[], CancerNode[], Tissue]]>();
  @Output() visibleTab = new EventEmitter<string>();

  public task: Task | null = null;

  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};
  private drugNodes: any[] = [];
  private drugEdges: any[] = [];
  public showDrugs = false;
  public mutationGradient = false;
  public tab: 'meta' | 'network' | 'table' = 'table';
  public physicsEnabled = true;

  public nodes: any;
  public cancerNodes: any;

  public tableDrugs: Array<Drug & Scored & Baited> = [];
  public tableNodes: Array<Node & Scored & Seeded & Baited> = [];
  public tableSelectedNodes: Array<Node & Scored & Seeded & Baited> = [];
  public tableCancerNodes: Array<CancerNode & Scored & Seeded> = [];
  public tableSelectedCancerNodes: Array<CancerNode & Scored & Seeded> = [];
  public tableNormalize = false;
  public tableHasScores = false;

  public expressionExpanded = false;
  public selectedTissue: Tissue | null = null;

  public mutationExpanded = false;
  public selectedMutationCancerType: MutationCancerType | null = null;

  public drugStatusExpanded = false;
  public selectedDrugStatus: DrugStatus | null = null;

  public algorithmNames = algorithmNames;

  public tableDrugScoreTooltip = '';
  public tableProteinScoreTooltip = '';

  constructor(
    public analysis: AnalysisService,
    private control: ControlService,
    private loadingOverlay: LoadingOverlayService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  async ngOnInit() {
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
      this.analysis.switchSelection(this.token);

      this.loadingOverlay.addTo('analysis-content');

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
        const result = await this.control.getTaskResult(this.token);
        const nodeAttributes = result.nodeAttributes || {};
        const isSeed: { [key: string]: boolean } = nodeAttributes.isSeed || {};

        // Reset
        this.nodeData = {nodes: null, edges: null};
        this.networkEl.nativeElement.innerHTML = '';
        this.network = null;
        this.showDrugs = false;

        // Create
        const {nodes, edges} = this.createNetwork(result);
        this.nodeData.nodes = new vis.DataSet(nodes);
        this.nodeData.edges = new vis.DataSet(edges);

        const container = this.networkEl.nativeElement;
        const isBig = nodes.length > 200 || edges.length > 200;
        const options = NetworkSettings.getOptions(isBig ? 'analysis-big' : 'analysis');
        // this.physicsEnabled = !isBig;

        this.network = new vis.Network(container, this.nodeData, options);

        this.network.on('stabilizationIterationsDone', () => {
          this.updatePhysicsEnabled(false);
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
              node.isSeed = isSeed[node.graphId];
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
              cancerDriverGene.isSeed = isSeed[cancerDriverGene.graphId];
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

        this.network.on('deselectNode', (properties) => {
          this.showDetailsChange.emit(null);
        });

        this.network.on('doubleClick', (properties) => {
          const nodeIds: Array<string> = properties.nodes;
          if (nodeIds.length > 0) {
            const nodeId = nodeIds[0];
            const node = this.nodeData.nodes.get(nodeId);
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

        this.network.on('click', async (properties) => {
          const selectedNodes = this.nodeData.nodes.get(properties.nodes);
          if (selectedNodes.length > 0) {
            const selectedNode = selectedNodes[0];
            const wrapper = selectedNode.wrapper;
            wrapper.comorbidities = await this.getComorbidities(wrapper);
            wrapper.cancerTypes = await this.getRelatedCancerTypes(wrapper);
            wrapper.nodeDegree = this.getNodeDegree(wrapper.data.graphId);
            this.showDetailsChange.emit(wrapper);
          } else {
            this.showDetailsChange.emit(null);
          }
        });

        this.analysis.subscribeList((items, selected) => {
          if (selected !== null) {
            const updatedNodes = [];
            for (const item of items) {
              const node = this.nodeData.nodes.get(item.nodeId);
              if (!node) {
                continue;
              }
              let drugType;
              let isATCCLassL;
              if (item.type === 'Drug') {
                drugType = item.data.status;
                isATCCLassL = item.data.isAtcAntineoplasticAndImmunomodulatingAgent;
              }
              const pos = this.network.getPositions([item.nodeId]);
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
            this.nodeData.nodes.update(updatedNodes);

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
            this.nodeData.nodes.forEach((node) => {
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
            this.nodeData.nodes.update(updatedNodes);

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
        this.loadingOverlay.removeFrom('analysis-content');
      }
    }
    this.emitVisibleItems(true);
  }

  public emitVisibleItems(on: boolean) {
    if (on) {
      this.visibleItems.emit([this.nodeData.nodes, [this.nodes, this.cancerNodes, this.selectedTissue]]);
    } else {
      this.visibleItems.emit(null);
    }
  }

  public close() {
    /**
     * closes analysis modal
     */
    // update the url
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { task: null },
      });
    this.analysis.switchSelection('main');
    this.token = null;
    this.tokenChange.emit(this.token);
    this.emitVisibleItems(false);
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

  public createNetwork(result: any): { edges: any[], nodes: any[] } {
    /**
     * Create network method for analysis tab, BE CAREFUL, explorer has method with same name
     *
     * Takes result from task result and creates network based on given data
     *
     * Returns edge and node wrapper object of created network
     */
    const nodes = [];
    const edges = [];

    const attributes = result.nodeAttributes || {};

    this.nodes = [];
    this.cancerNodes = [];
    const network = result.network;

    const nodeTypes = attributes.nodeTypes || {};
    const isSeed = attributes.isSeed || {};
    const scores = attributes.scores || {};
    const details = attributes.details || {};
    const wrappers: { [key: string]: Wrapper } = {};
    for (const node of network.nodes) {
      if (nodeTypes[node] === 'Node') {
        this.nodes.push(details[node]);
        wrappers[node] = getWrapperFromNode(details[node]);
      } else if (nodeTypes[node] === 'CancerNode') {
        this.cancerNodes.push(details[node]);
        wrappers[node] = getWrapperFromCancerNode(details[node]);
      } else if (nodeTypes[node] === 'Drug') {
        wrappers[node] = getWrapperFromDrug(details[node]);
      }
      nodes.push(this.mapNode(nodeTypes[node], details[node], isSeed[node], scores[node]));
    }

    for (const edge of network.edges) {
      edges.push(this.mapEdge(edge, 'node-node', wrappers));
    }

    return {
      nodes,
      edges,
    };
  }

  private mapNode(nodeType: WrapperType, details: Node | CancerNode | Drug, isSeed?: boolean, score?: number): any {
    /**
     * Wraps, whether it is gene, cancerdrivergene or drug object, to a network node object
     */
    let nodeLabel;
    let wrapper: Wrapper;
    let drugType;
    let isATCClassL;
    if (nodeType === 'Node') {
      const gene = details as Node;
      wrapper = getWrapperFromNode(gene);
      nodeLabel = gene.name;
      if (!gene.name) {
        nodeLabel = gene.backendId;
      }
    } else if (nodeType === 'Drug') {
      const drug = details as Drug;
      wrapper = getWrapperFromDrug(drug);
      drugType = drug.status;
      isATCClassL = drug.isAtcAntineoplasticAndImmunomodulatingAgent;
      if (drugType === 'approved') {
        nodeLabel = drug.name;
      } else {
        nodeLabel = drug.dbId;
      }
    } else if (nodeType === 'CancerNode') {
      const cancerDriverGene = details as CancerNode;
      wrapper = getWrapperFromCancerNode(cancerDriverGene);
      nodeLabel = cancerDriverGene.name;
    }

    const node = NetworkSettings.getNodeStyle(nodeType, isSeed, this.analysis.inSelection(wrapper),
      drugType, isATCClassL);
    node.id = wrapper.nodeId;
    node.label = nodeLabel;
    node.nodeType = nodeType;
    node.isSeed = isSeed;
    node.wrapper = wrapper;

    return node;
  }

  private mapEdge(edge: any, type: 'node-node' | 'to-drug', wrappers?: { [key: string]: Wrapper }): any {
    /**
     * Wraps edge, whether it is gene-gene or to-drug edge into a network edge object
     */
    let edgeColor;
    if (type === 'node-node') {
      edgeColor = {
        color: NetworkSettings.getColor('edgeGene'),
        highlight: NetworkSettings.getColor('edgeGeneHighlight'),
      };
      const {from, to} = getNodeIdsFromEdgeGene(edge, wrappers);
      return {
        from, to,
        color: edgeColor,
      };
    } else if (type === 'to-drug') {
      edgeColor = {
        color: NetworkSettings.getColor('edgeGeneDrug'),
        highlight: NetworkSettings.getColor('edgeGeneDrugHighlight'),
      };
      const {from, to} = getNodeIdsFromCancerDriverGeneDrugInteraction(edge);
      return {
        from, to,
        color: edgeColor,
      };
    }
  }

  public async toggleDrugs(drugStatus: DrugStatus | null) {
    /**
     * fetches and displays drug data in the network (in case task.info.target === 'drug-target')
     * otherwise the drug toggle button is replaced by the animation on / off button
     */
    this.showDrugs = drugStatus !== null;
    this.nodeData.nodes.remove(this.drugNodes);
    this.nodeData.edges.remove(this.drugEdges);
    this.drugNodes = [];
    this.drugEdges = [];
    if (this.showDrugs) {
      const result = await this.control.getDrugInteractions(this.token, drugStatus).catch(
        (err: HttpErrorResponse) => {
          // simple logging, but you can do a lot more, see below
          toast({
            message: 'An error occured while fetching the drugs.',
            duration: 5000,
            dismissible: true,
            pauseOnHover: true,
            type: 'is-danger',
            position: 'top-center',
            animate: {in: 'fadeIn', out: 'fadeOut'}
          });
          this.showDrugs = false;
          return;
        });
      const drugs = result.drugs;
      const edges = result.edges;

      if (drugs.length === 0) {
        toast({
          message: 'No drugs found.',
          duration: 5000,
          dismissible: true,
          pauseOnHover: true,
          type: 'is-warning',
          position: 'top-center',
          animate: {in: 'fadeIn', out: 'fadeOut'}
        });
      } else {
        for (const drug of drugs) {
          this.drugNodes.push(this.mapNode('Drug', drug, false, null));
        }

        for (const interaction of edges) {
          const edge = {from: interaction.geneGraphId, to: interaction.drugGraphId};
          this.drugEdges.push(this.mapEdge(edge, 'to-drug'));
        }
        this.nodeData.nodes.add(Array.from(this.drugNodes.values()));
        this.nodeData.edges.add(Array.from(this.drugEdges.values()));

        // active physics for some seconds in order to sort the drugs into the network.
        this.updatePhysicsEnabled(true);
        setTimeout(() => {
          this.updatePhysicsEnabled(false);
        }, 5000);

      }
    }
  }

  private async getRelatedCancerTypes(item: Wrapper) {
    const dataset: Dataset = {backendId: this.task.info.parameters.cancerDatasetId,
      name: this.task.info.parameters.cancerDataset, link: ''};
    const data = await this.control.getRelatedCancerTypes(dataset, item.data);
    return data.cancerTypes;
  }

  private async getComorbidities(item: Wrapper) {
    const data = await this.control.getComorbidities(item.data);
    return data.interactions;
  }

  private _resetNetworkColorGradient(nodeType: ('Node' | 'CancerNode')): Node[] {
    /**
     * resets the color gradient from tissue expression to normal network colors
     * We have to differentiate between Nodes and CancerNodes to not mix up the types in the network
     */
    const updatedNodes = [];
    let nodes;
    if (nodeType === 'Node') {
      nodes = this.nodes;
    } else {
      nodes = this.cancerNodes;
    }
    for (const gene of nodes) {
      let item;
      if (nodeType === 'Node') {
        item = getWrapperFromNode(gene as Node);
      } else {
        item = getWrapperFromCancerNode(gene as CancerNode);
      }

      const node = this.nodeData.nodes.get(item.nodeId);
      if (!node) {
        continue;
      }
      const pos = this.network.getPositions([item.nodeId]);
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

      const node = this.nodeData.nodes.get(item.nodeId);
      if (!node) {
        continue;
      }
      // calculate color gradient
      const gradient = n.mutationCounts !== null ? ( Math.pow( n.mutationCounts / maxCount, 1 / 3 ) ) : -1;
      const pos = this.network.getPositions([item.nodeId]);
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

  public updatePhysicsEnabled(bool: boolean) {
    /**
     * Controls the physics enabled button in the analysis network
     */
    this.physicsEnabled = bool;
    this.network.setOptions({
      physics: {
        enabled: this.physicsEnabled,
        stabilization: {
          enabled: false,
        },
      }
    });
  }

  public toCanvas() {
    /**
     * Analysis network to canvas + download
     */
    html2canvas(this.networkEl.nativeElement).then((canvas) => {
      const generatedImage = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = `Network.png`;   // TODO proper name for analysis network (take analysis task into account)
      a.click();
    });
  }

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

    // remove potential tissue selection
    this.selectedMutationCancerType = mutationCancerType;
    this.selectedTissue = null;

    if (!this.selectedMutationCancerType) {
      // if user deactivated mutation color gradient, we reset all nodes in network
      // reset each normal genes and cancer genes
      const updatedNodes = [
        ...this._resetNetworkColorGradient('Node'),
        ...this._resetNetworkColorGradient('CancerNode')
      ];
      this.nodeData.nodes.update(updatedNodes);

    } else {
      // else gradient is activated, color nodes
      const mutationsCounts = [];

      // fetch all data
      const response = await this.control.mutationScores(mutationCancerType, this.nodes, this.cancerNodes);
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
      this.nodeData.nodes.update(updatedNodes);
    }
  }

  public selectTissue(tissue: Tissue | null) {
    /**
     * Handle tissue button and fetch data based on tissue + manage expression data
     */
    // remove potential mutation gradient selection
    this.selectedMutationCancerType = null;
    this.expressionExpanded = false;

    if (!tissue) {
      // if no tissue selected, we reset all nodes in network
      this.selectedTissue = null;
      // reset each normal genes and cancer genes
      const updatedNodes = [
        ...this._resetNetworkColorGradient('Node'),
        ...this._resetNetworkColorGradient('CancerNode')
      ];
      this.nodeData.nodes.update(updatedNodes);

    } else {
      // ELSE tissue is selected, fetch data based on min expression value
      this.selectedTissue = tissue;

      const minExp = 0.3;

      // fetch all data
      this.control.tissueExpressionGenes(tissue, this.nodes, this.cancerNodes)
        .subscribe((response) => {
          // response is object with key "cancerGenes" and "genes"
          // each which is list of objects with "gene" and "level" (expression value)
          const maxExpr = Math.max(...[...response.genes, ...response.cancerGenes].map(lvl => lvl.level));

          // fetch each normal genes and cancer genes
          const updatedGenes = this._interpretTissueExpressionResponse(
            response.genes, maxExpr, minExp, 'Node'
          );
          const updatedCancerGenes = this._interpretTissueExpressionResponse(
            response.cancerGenes, maxExpr, minExp, 'CancerNode'
          );

          const updatedNodes = [...updatedGenes, ...updatedCancerGenes];
          this.nodeData.nodes.update(updatedNodes);
        });
    }
  }

  private _interpretTissueExpressionResponse(
    /**
     * Reads the result of the "TissueExpressionView" and converts it into input for the network
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
        nodes = this.nodes;
      } else {
        item = getWrapperFromCancerNode(lvl.gene as CancerNode);
        nodes = this.cancerNodes;
      }

      const node = this.nodeData.nodes.get(item.nodeId);
      if (!node) {
        continue;
      }
      // calculate color gradient
      const gradient = lvl.level !== null ? (Math.pow(lvl.level / maxExpr, 1 / 3) * (1 - minExp) + minExp) : -1;
      const pos = this.network.getPositions([item.nodeId]);
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
      nodes.find(gene => getGeneNodeId(gene) === item.nodeId).expressionLevel = lvl.level;
      (node.wrapper.data as (Node | CancerNode)).expressionLevel = lvl.level;
      updatedNodes.push(node);
    }
    return updatedNodes;
  }

  public formatStringList(stingList) {
    return stingList.join(', ');
  }

  public getNodeDegree(graphId: string): number {
    /**
     * returns the node degree of a given node in the current network
     */
    // TODO info tile gets called like many times when opening once
    try {
      // do this just to check if node is in network
      this.network.getPosition(graphId);
      // this function somehow just crashes without throwing an error, a behaviour we cannot catch
      return this.network.getConnectedEdges(graphId).length;
    } catch (err) {
      return 0;
    }
  }

}


