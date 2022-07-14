import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CancerNode, CancerType, Dataset, Disease, Drug, DrugStatus, ExpressionCancerType, getGeneNodeId, getNodeIdsFromGeneDrugInteraction, getNodeIdsFromGeneGeneInteraction, getWrapperFromCancerNode, getWrapperFromDrug, getWrapperFromNode, Interaction, MutationCancerType, Node, Tissue, Wrapper, WrapperType } from '../../../../interfaces';
import { Network } from '../../../../main-network';
import { NetworkSettings } from '../../../../network-settings';
import { AnalysisService } from '../../../../services/analysis/analysis.service';
import { ControlService } from '../../../../services/control/control.service';
import { ExplorerDataService } from '../../../../services/explorer-data/explorer-data.service';
import { LoadingOverlayService } from '../../../../services/loading-overlay/loading-overlay.service';
import { toast } from 'bulma-toast';
import html2canvas from 'html2canvas';
import { HttpErrorResponse } from '@angular/common/http';


declare var vis: any;

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent implements OnInit {

  @Input() networkType: 'basic' | 'analysis';
  @Input() target: 'drug' | 'drug-target' | 'none';

  // dataset tile
  public selectedDataset: Dataset;
  public selectedGeneInteractionDataset: Dataset = undefined;
  public selectedDrugInteractionDataset: Dataset = undefined;

  // expression button
  public expressionExpanded = false;

  // mutation per cancer type button
  public mutationCancerTypesExpanded = false;

  // mutation cancer type dropdown
  public selectedMutationCancerType: MutationCancerType | null = null;

  // expression cancer type dropdown
  public selectedExpressionCancerType: ExpressionCancerType | null = null;

  // tissue dropdown
  public selectedTissue: Tissue | null = null;

  // gene interaction dataset
  public selectedInteractionGeneDataset: Dataset;

  // cancer types
  public selectedCancerTypeItems: CancerType[];

  // query network tile
  public queryItems: Wrapper[] = [];

  // datasets
  public currentDataset: Dataset;
  public currentGeneInteractionDataset: Dataset = undefined;
  public currentDrugInteractionDataset: Dataset = undefined;

  // network
  public networkVisJs: any = null;

  public networkData: Network;
  public visibleCancerNodeCount = 0;
  public visibleNodeCount = 0;
  public visibleEdges: Set<string> = new Set();
  public nodeData: { nodes: any, edges: any } = { nodes: [], edges: [] };
  public physicsEnabled = true;

  public nodes: any = []; // all network node objects
  public basicNodes: Node[] = [];  // all gene nodes
  public cancerNodes: CancerNode[] = [];  // all cancer nodes
  public interactions: Interaction[] = [];
  public cancerNodesSup: CancerNode[] = [];
  public drugNodes: Drug[] = [];  // all drug nodes
  private drugEdges: Interaction[] = [];


  public currentViewNodes: Node[] = [];
  public currentViewCancerNodes: CancerNode[] = [];

  public networkFullscreenStatus = false;
  public nodeDegree: number;

  // store seed information for analysis network
  public isSeed = {};

  // for analysis network
  public drugStatusExpanded = false;
  public selectedDrugStatus: DrugStatus | null = null;
  public showDrugs = false;

  public showIsolatedNodes = true;


  @ViewChild('network', { static: false }) networkEl: ElementRef;
  @ViewChild('network_container', { static: false }) networkContainerEl: ElementRef;

  constructor(
    public explorerData: ExplorerDataService,
    private control: ControlService,
    private loadingOverlay: LoadingOverlayService,
    public analysis: AnalysisService,
  ) { }

  ngOnInit(): void {
    // register component in explorerData
    this.explorerData.networks[this.networkType] = this;
    // activate basic network on init
    if (this.explorerData.selectedAnalysisToken) {
      this.explorerData.activate('analysis');
    } else {
      this.explorerData.activate('basic');
    }
  }

  public toggleNetworkFullscreen() {
    /**
     * Either sets network to fullscreen mode or back to normal mode
     */

    // either add or remove class 'fullscreen' with settings for fullscreen network
    this.networkFullscreenStatus ? this.networkContainerEl.nativeElement.classList.remove('fullscreen') : this.networkContainerEl.nativeElement.classList.add('fullscreen');

    this.networkFullscreenStatus = !this.networkFullscreenStatus;

    // adapt network to new layout
    this.networkVisJs.redraw();
  }

  private zoomToNode(id: string) {
    /**
     * Zooming in to node in network
     */
    this.nodeData.nodes.getIds(); // TODO what is this line doing? Why do we fetch id's?
    const coords = this.networkVisJs.getPositions(id)[id];
    if (!coords) {
      return;
    }
    let zoomScale = null;
    if (id.startsWith('eff')) {
      zoomScale = 1.0;
    } else {
      zoomScale = 3.0;
    }
    this.networkVisJs.moveTo({
      position: { x: coords.x, y: coords.y },
      scale: zoomScale,
      animation: true,
    });
  }

  public resetNetwork() {
    // Reset
    this.explorerData.activeNetwork.nodeData = { nodes: null, edges: null };
    this.explorerData.activeNetwork.network = null;
  }

  public async getMainNetwork(dataset: Dataset, interactionDataset: Dataset, cancerType: CancerType[]) {
    /**
     * uses getNetwork() to fetch network data
     * +
     * initializes network
     */

    // reset old stuff
    this.analysis.resetSelection();
    this.explorerData.selectedWrapper = null;

    // fetch all relevant network data and store it in component
    // genes are returned alphabetically
    await this.explorerData.getBasicNetwork(dataset, interactionDataset, cancerType);

    this.networkData = new Network(this.basicNodes, this.cancerNodes, this.interactions);
    this.networkData.linkNodes();

    // get node and edge data for network
    const { nodes, edges } = this.mapDataToNodes(this.networkData);
    this.nodeData.nodes = new vis.DataSet(nodes);
    this.nodeData.edges = new vis.DataSet(edges);
  }

  public setNetworkDefaultSettings() {
    // stop network animation when stable state is reached
    this.networkVisJs.on('stabilizationIterationsDone', () => {
      this.updatePhysicsEnabled(false);

      // save the positions after stabilization
      const positions = this.networkVisJs.getPositions();

      // update in network
      this.networkData.updateNodePositions(positions);
      // update in reference
      this.nodeData.nodes.forEach((node) => {
        node.x = positions[node.id].x;
        node.y = positions[node.id].y;
      });
    });

    this.networkVisJs.on('click', (properties) => {
      this.onClick(properties);
    });

    this.networkVisJs.on('doubleClick', (properties) => {
      NetworkSettings.doubleClickTime = new Date();
      this.onDoubleClick(properties);
    });

    this.networkVisJs.on('deselectNode', (properties) => {
      this.explorerData.closeSummary();
    });
  }


  public async createNetwork() {

    // set initial view counts
    this.visibleCancerNodeCount = this.cancerNodes.length;
    this.visibleNodeCount = this.basicNodes.length;
    const container = this.networkEl.nativeElement;
    const options = NetworkSettings.getOptions('main');
    // destroy old network if exists
    if (this.networkVisJs !== null) {
      this.networkVisJs.destroy();
    }
    this.networkVisJs = new vis.Network(container, this.nodeData, options);

    if (this.explorerData.selectedWrapper) {
      this.zoomToNode(this.explorerData.selectedWrapper.nodeId);
    }

    // fill query items for network search
    this.explorerData.fillQueryItems(this.basicNodes, this.cancerNodes, this.drugNodes, true);
    if (this.explorerData.selectedWrapper) {
      this.networkVisJs.selectNodes([this.explorerData.selectedWrapper.nodeId]);
    }

    // fill adding option in the filter menu
    this.explorerData.fillFilterItems(this.cancerNodesSup);

  }

  public onClick(properties) {
    NetworkSettings.t0 = new Date();
    // @ts-ignore
    if (NetworkSettings.t0 - NetworkSettings.doubleClickTime > NetworkSettings.threshold) {
      const $this = this;
      setTimeout(() => {
        // @ts-ignore
        if (NetworkSettings.t0 - NetworkSettings.doubleClickTime > NetworkSettings.threshold) {
          $this.doOnClick(properties);
        }
      }, NetworkSettings.threshold);
    }
  }

  public doOnClick(properties) {
    // open summary for node on click
    const nodeIds: Array<string> = properties.nodes;
    if (nodeIds.length > 0) {
      const nodeId = nodeIds[0];
      const node = this.nodeData.nodes.get(nodeId);
      const wrapper = node.wrapper;
      this.explorerData.openSummary(wrapper, false);
      this.explorerData.nodeDegree = this.getNodeDegree(wrapper.data.graphId);
    } else {
      this.explorerData.closeSummary();
    }
  }

  public onDoubleClick(properties) {
    // select node on double click, this will also open summary on first click
    const nodeIds: Array<string> = properties.nodes;
    if (nodeIds.length > 0) {
      const nodeId = nodeIds[0];
      const node = this.nodeData.nodes.get(nodeId);
      const wrapper = node.wrapper;
      if (this.analysis.inSelection(wrapper)) {
        this.analysis.removeItems([wrapper]);
      } else {
        this.analysis.addItems([wrapper]);
      }
    }
  }

  public getNodeDegree(graphId: string) {
    /**
     * returns the node degree of a given node in the current network
     */
    // TODO info tile gets called like many times when opening once
    try {
      // do this just to check if node is in network
      this.networkVisJs.getPosition(graphId);
      // this function somehow just crashes without throwing an error, a behaviour we cannot catch
      return this.networkVisJs.getConnectedEdges(graphId).length;

    } catch (err) {
      return undefined;
    }
  }

  public async addSelectionToNetwork() {
    const selection: Wrapper[] = this.analysis.getSelection();
    const toAdd: Wrapper[] = [];
    selection.forEach((wrapper) => {
      // see if node in network
      const node = this.nodeData.nodes.get(wrapper.nodeId);
      // if node is not in network
      if (node === null) {
        toAdd.push(wrapper);
      }
    });

    if (toAdd.length > 60) {
      // we warn user if many nodes are to be added
      if (!window.confirm(
        `Adding many nodes might slow the webpage down, continue?
        Less than 60 nodes are recommended`
      )) {
        // stop if user declines
        return;
      }
    }

    this.loadingOverlay.addTo('loadingOverlayTarget');

    await this.addNetworkNodes(toAdd);

    this.loadingOverlay.removeFrom('loadingOverlayTarget');
  }

  public async addNetworkNodes(wrapperList: Wrapper[]) {
    /**
     * Fetches interaction information from API and fills information in
     *
     * We need to split the data fetching process and the adding process in case newly nodes are connected to nodes
     * that are still to be added
     */

    const dataList = [];
    for (const wrapper of wrapperList) {
      const item = wrapper.data as CancerNode | Node;
      const type = wrapper.type as 'CancerNode' | 'Node';

      // add edges for node dynamically
      const data = await this.control.getNodeInteractions(
        this.selectedDataset,
        this.selectedInteractionGeneDataset,
        this.selectedCancerTypeItems,
        item);
      data.type = type;
      data.item = item;
      dataList.push(data);
    }

    // add all the nodes
    const nodeItems = [];
    const cancerNodeItems = [];
    for (const data of dataList) {
      const type = data.type;
      const item = data.item;
      // add node dynamically to network
      let node;
      if (type === 'CancerNode') {
        this.networkData.cancerNodes.push(item as CancerNode);
        node = this.explorerData.mapCancerDriverGeneToNode(item as CancerNode);
        cancerNodeItems.push(item);
      } else {
        this.networkData.nodes.push(item as Node);
        node = this.explorerData.mapGeneToNode(item as Node);
        nodeItems.push(item);
      }
      // add data to network interface
      this.networkData.edges.push(...data.interactions);

      // add data to network
      this.nodeData.nodes.add(node);
    }
    // add node to query items
    this.explorerData.fillQueryItems(nodeItems, cancerNodeItems, [], false);

    // now add edges in a second step to make sure we dont miss any connection
    for (const data of dataList) {
      const edgesToAdd = [];
      for (const interaction of data.interactions) {
        if ((this.nodeData.nodes.get(interaction.interactorAGraphId) !== null) &&
          (this.nodeData.nodes.get(interaction.interactorBGraphId) !== null)) {
          edgesToAdd.push(this.mapEdge(interaction));
        }
      }
      this.nodeData.edges.add(edgesToAdd);
    }

    // TODO just do this for new nodes to speed up
    // connect the edges
    this.networkData.linkNodes();

    this.visibleCancerNodeCount += cancerNodeItems.length;
    this.visibleNodeCount += nodeItems.length;

    // check if expressionCancerType is selected, if yes, refresh so new node gets color gradient
    // TODO just do this for new node
    if (this.explorerData.activeNetwork.selectedExpressionCancerType) {
      this.selectExpressionCancerType(this.explorerData.activeNetwork.selectedExpressionCancerType);
    }

    toast({
      message: `${dataList.length} nodes added to the network.`,
      duration: 10000,
      dismissible: true,
      pauseOnHover: true,
      type: 'is-success',
      position: 'top-center',
      animate: { in: 'fadeIn', out: 'fadeOut' }
    });

  }

  public setClusterPhysics() {
    this.networkVisJs.setOptions({
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          theta: 0.5,
          gravitationalConstant: -100,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 1,
        },
        stabilization: {
          enabled: true,
          iterations: 1000
        }
      }
    });
  }

  public updatePhysicsEnabled(bool) {
    /**
     * Updates network physics settings if button is pressed
     */
    this.physicsEnabled = bool;
    this.networkVisJs.setOptions({
      physics: {
        enabled: this.physicsEnabled,
        stabilization: {
          enabled: false,
        },
      }
    });
  }

  private mapEdge(edge: any, type: 'node-node' | 'to-drug' = 'node-node', wrappers?: { [key: string]: Wrapper }): any {
    /**
     * Wraps edge, whether it is gene-gene or to-drug edge into a network edge object
     */
    let edgeColor;
    if (type === 'node-node') {
      edgeColor = {
        color: NetworkSettings.getColor('edgeGene'),
        highlight: NetworkSettings.getColor('edgeGeneHighlight'),
      };
      const { from, to } = getNodeIdsFromGeneGeneInteraction(edge);
      return {
        from, to,
        color: edgeColor,
      };
    } else if (type === 'to-drug') {
      edgeColor = {
        color: NetworkSettings.getColor('edgeGeneDrug'),
        highlight: NetworkSettings.getColor('edgeGeneDrugHighlight'),
      };
      const { from, to } = getNodeIdsFromGeneDrugInteraction(edge);
      return {
        from, to,
        color: edgeColor,
      };
    }
  }

  public toCanvas() {
    /**
     * prints the network to canvas and downloads it
     */
    html2canvas(this.networkEl.nativeElement).then((canvas) => {
      const generatedImage = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = `networkVisJs.png`; // TODO integrate cancer type and cancer dataset into name
      a.click();
    });
  }

  public mapDataToNodes(data: Network): { nodes: any[], edges: any[] } {
    /**
     * Maps raw network data to network node and gene objects by using
     * mapGeneToNode(), mapCancerDriverGeneToNode() and mapEdge()
     *
     * Returns edges and node objects
     */
    const nodes = [];
    const edges = [];

    for (const gene of data.nodes) {
      nodes.push(this.explorerData.mapGeneToNode(gene));
    }

    for (const cdg of data.cancerNodes) {
      nodes.push(this.explorerData.mapCancerDriverGeneToNode(cdg));
    }

    for (const edge of data.edges) {
      edges.push(this.mapEdge(edge));
    }

    return {
      nodes,
      edges,
    };
  }

  public async colorMutationGradient(mutationCancerType: MutationCancerType | null) {
    /**
     * Handle mutation button and colors the node based on nMutations
     */

    // remove potential expressionCancerType selection
    this.explorerData.activeNetwork.selectedExpressionCancerType = null;
    this.explorerData.activeNetwork.selectedMutationCancerType = mutationCancerType;
    this.explorerData.activeNetwork.selectedExpressionCancerType = null;
    this.selectedTissue = null;

    if (!this.explorerData.activeNetwork.selectedMutationCancerType) {
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
      const response = await this.control.mutationScores(mutationCancerType, this.basicNodes, this.cancerNodes);
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
    this.explorerData.activeNetwork.selectedExpressionCancerType = null;
    this.explorerData.activeNetwork.selectedMutationCancerType = null;
    this.explorerData.activeNetwork.selectedExpressionCancerType = null;
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
      this.control.tissueExpressionGenes(tissue, this.basicNodes, this.cancerNodes)
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

  public selectExpressionCancerType(expressionCancerType: ExpressionCancerType | null) {
    /**
     * Handle expressionCancerType button and fetch data based on expressionCancerType + manage expression data
     */
    // remove potential mutation gradient selection

    this.explorerData.activeNetwork.selectedExpressionCancerType = null;
    this.explorerData.activeNetwork.selectedMutationCancerType = null;
    this.selectedTissue = null;
    this.expressionExpanded = false;

    if (!expressionCancerType) {
      // if no expressionCancerType selected, we reset all nodes in network
      this.explorerData.activeNetwork.selectedExpressionCancerType = null;
      // reset each normal genes and cancer genes
      const updatedNodes = [
        ...this._resetNetworkColorGradient('Node'),
        ...this._resetNetworkColorGradient('CancerNode')
      ];
      this.nodeData.nodes.update(updatedNodes);

    } else {
      // ELSE expressionCancerType is selected, fetch data based on min expression value
      this.explorerData.activeNetwork.selectedExpressionCancerType = expressionCancerType;

      const minExp = 0.3;
      // fetch all data
      this.control.expressionCancerTypeExpressionGenes(expressionCancerType, this.basicNodes, this.cancerNodes)
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
          this.nodeData.nodes.update(updatedNodes);
        });
    }
  }

  private _resetNetworkColorGradient(nodeType: ('Node' | 'CancerNode')): Node[] {
    /**
     * resets the color gradient from expressionCancerType expression to normal network colors
     * We have to differentiate between Nodes and CancerNodes to not mix up the types in the network
     */

    const updatedNodes = [];
    let nodes;
    if (nodeType === 'Node') {
      nodes = this.basicNodes;
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
      const pos = this.networkVisJs.getPositions([item.nodeId]);
      node.x = pos[item.nodeId].x;
      node.y = pos[item.nodeId].y;
      Object.assign(node,
        NetworkSettings.getNodeStyle(
          node.wrapper.type,
          node.isSeed,
          this.analysis.inSelection(item),
          undefined,
          undefined,
          1.0,
          node.wrapper.data.inCancernet));
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
      let nodes;
      if (nodeType === 'Node') {
        item = getWrapperFromNode(n as Node);
        nodes = this.basicNodes;
      } else {
        item = getWrapperFromCancerNode(n as CancerNode);
        nodes = this.cancerNodes;
      }

      const node = this.nodeData.nodes.get(item.nodeId);
      if (!node) {
        continue;
      }
      // calculate color gradient
      const gradient = n.mutationCounts !== null ? (Math.pow(n.mutationCounts / maxCount, 1 / 3)) : -1;
      const pos = this.networkVisJs.getPositions([item.nodeId]);
      node.x = pos[item.nodeId].x;
      node.y = pos[item.nodeId].y;
      Object.assign(node,
        NetworkSettings.getNodeStyle(
          node.wrapper.type,
          node.isSeed,
          this.analysis.inSelection(item),
          undefined,
          undefined,
          gradient,
          node.wrapper.data.inCancernet));
      node.wrapper = item;
      node.gradient = gradient;

      nodes.find(gene => getGeneNodeId(gene) === item.nodeId).mutationScore = n.mutationScore;
      (node.wrapper.data as (Node | CancerNode)).mutationScore = n.mutationScore;

      updatedNodes.push(node);
    }
    return updatedNodes;
  }

  private _interpretExpressionCancerTypeExpressionResponse(
    /**
     * Reads the result of the "ExpressionCancerTypeExpressionView" and converts it into input for the network
     * Main function is to calculate the color gradient based on expression value
     * We have to differentiate between Node and CancerNode to not mix up the types in the network
     */
    geneList: { gene: (Node | CancerNode), level: number, score?: number }[],
    maxExpr: number,
    minExp: number,
    nodeType: ('Node' | 'CancerNode')
  ): Node[] {
    const updatedNodes = [];
    for (const gene of geneList) {
      let item;
      let nodes;
      if (nodeType === 'Node') {
        item = getWrapperFromNode(gene.gene as Node);
        nodes = this.basicNodes;
      } else {
        item = getWrapperFromCancerNode(gene.gene as CancerNode);
        nodes = this.cancerNodes;
      }

      const node = this.nodeData.nodes.get(item.nodeId);
      if (!node) {
        continue;
      }
      // calculate color gradient
      const gradient = gene.level !== null ? (Math.pow(gene.level / maxExpr, 1 / 1) * (1 - minExp) + minExp) : -1;
      const pos = this.networkVisJs.getPositions([item.nodeId]);
      node.x = pos[item.nodeId].x;
      node.y = pos[item.nodeId].y;
      Object.assign(node,
        NetworkSettings.getNodeStyle(
          node.wrapper.type,
          node.isSeed,
          this.analysis.inSelection(item),
          undefined,
          undefined,
          gradient,
          node.wrapper.data.inCancernet));
      node.wrapper = item;
      node.gradient = gradient;
      nodes.find(g => getGeneNodeId(g) === item.nodeId).expressionLevelScore = gene.score;
      (node.wrapper.data as (Node | CancerNode)).expressionLevelScore = gene.score;
      nodes.find(g => getGeneNodeId(g) === item.nodeId).expressionLevel = gene.level;
      (node.wrapper.data as (Node | CancerNode)).expressionLevel = gene.level;
      updatedNodes.push(node);
    }
    return updatedNodes;
  }



  public async addVisibleGenesBasedOnComorbidity(disease: Disease) {
    /**
     * Marking genes as selected if they occur in selected diseases.
     * Looks up all genes in current networkVisJs.
     */
    const result = await this.control.queryDiseaseGenesByGenes(
      [disease],
      this.basicNodes,
      this.cancerNodes
    );
    let n = 0;
    n += this.analysis.addDiseaseGenes(
      this.nodes, this.basicNodes, result.inDiseasesGenes, 'Node');
    n += this.analysis.addDiseaseGenes(
      this.nodes, this.cancerNodes, result.inDiseasesCancerGenes, 'CancerNode');

    // if no nodes were added, remove selected nodes instead
    if (!n) {
      this.analysis.removeDiseaseGenes(
        this.nodes, this.basicNodes, result.inDiseasesGenes, 'Node');
      this.analysis.removeDiseaseGenes(
        this.nodes, this.cancerNodes, result.inDiseasesCancerGenes, 'CancerNode');
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
        nodes = this.basicNodes;
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
      const pos = this.networkVisJs.getPositions([item.nodeId]);
      node.x = pos[item.nodeId].x;
      node.y = pos[item.nodeId].y;
      Object.assign(node,
        NetworkSettings.getNodeStyle(
          node.wrapper.type,
          node.isSeed,
          this.analysis.inSelection(item),
          undefined,
          undefined,
          gradient,
          node.wrapper.data.inCancernet
        ));
      node.wrapper = item;
      node.gradient = gradient;
      // node.opacity = gradient;

      nodes.find(gene => getGeneNodeId(gene) === item.nodeId).expressionLevel = lvl.level;
      (node.wrapper.data as (Node | CancerNode)).expressionLevel = lvl.level;
      // node.shape = 'custom';
      // node.ctxRenderer = pieChartContextRenderer;
      updatedNodes.push(node);
    }
    return updatedNodes;
  }

  public mapNode(nodeType: WrapperType, details: Node | CancerNode | Drug, isSeed?: boolean, score?: number, degree?: number): any {
    /**
     * Wraps, whether it is gene, cancerdrivergene or drug object, to a network node object
     */
    let nodeLabel;
    let wrapper: Wrapper;
    let drugType;
    let isATCClassL;
    let inCancernet;
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
      inCancernet = drug.inCancernet;
      if (drugType === 'approved') {
        nodeLabel = drug.name;
      } else {
        nodeLabel = drug.name;
        // nodeLabel = drug.dbId;
      }
    } else if (nodeType === 'CancerNode') {
      const cancerDriverGene = details as CancerNode;
      wrapper = getWrapperFromCancerNode(cancerDriverGene);
      nodeLabel = cancerDriverGene.name;
    }
    const node = NetworkSettings.getNodeStyle(nodeType, isSeed, this.analysis.inSelection(wrapper),
      drugType, isATCClassL, undefined, inCancernet);
    node.id = wrapper.nodeId;
    node.label = nodeLabel;
    node.nodeType = nodeType;
    node.isSeed = isSeed;
    node.wrapper = wrapper;
    node.degree = degree;
    return node;
  }

  public async toggleDrugs(drugStatus: DrugStatus | null) {
    /**
     * fetches and displays drug data in the network (in case task.info.target === 'drug-target')
     * otherwise the drug toggle button is replaced by the animation on / off button
     */
    this.showDrugs = drugStatus !== null;
    this.explorerData.activeNetwork.nodeData.nodes.remove(this.drugNodes);
    this.explorerData.activeNetwork.nodeData.edges.remove(this.drugEdges);
    this.drugNodes = [];
    this.drugEdges = [];
    if (this.showDrugs) {
      const result = await this.control.getDrugInteractions(this.explorerData.selectedAnalysisToken, drugStatus).catch(
        (err: HttpErrorResponse) => {
          // simple logging, but you can do a lot more, see below
          toast({
            message: 'An error occured while fetching the drugs.',
            duration: 5000,
            dismissible: true,
            pauseOnHover: true,
            type: 'is-danger',
            position: 'top-center',
            animate: { in: 'fadeIn', out: 'fadeOut' }
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
          animate: { in: 'fadeIn', out: 'fadeOut' }
        });
      } else {
        for (const drug of drugs) {
          this.drugNodes.push(this.mapNode('Drug', drug, false, null));
        }

        for (const interaction of edges) {
          const edge = { from: interaction.geneGraphId, to: interaction.drugGraphId };
          this.drugEdges.push(this.mapEdge(edge, 'to-drug'));
        }
        this.explorerData.activeNetwork.nodeData.nodes.add(Array.from(this.drugNodes.values()));
        this.explorerData.activeNetwork.nodeData.edges.add(Array.from(this.drugEdges.values()));

        // active physics for some seconds in order to sort the drugs into the network.
        this.explorerData.activeNetwork.updatePhysicsEnabled(true);
        setTimeout(() => {
          this.explorerData.activeNetwork.updatePhysicsEnabled(false);
        }, 5000);

      }
    }
  }

  public toggleIsolatedNodes() {
    this.showIsolatedNodes = !this.showIsolatedNodes;
    if (!this.showIsolatedNodes) {
      const filteredNodes = [];
      this.networkData.nodes.forEach((node) => {
        if (!this.getNodeDegree(node.graphId)) {
          filteredNodes.push(node.graphId)
        }
      });
      this.networkData.cancerNodes.forEach((node) => {
        if (!this.getNodeDegree(node.graphId)) {
          filteredNodes.push(node.graphId)
        }
      });
      this.explorerData.activeNetwork.nodeData.nodes.remove(filteredNodes);
    } else {
      const addedNodes = [];
      for (const node of this.networkData.nodes) {
        if (!this.getNodeDegree(node.graphId)) {
          addedNodes.push(this.explorerData.mapGeneToNode(node));
        }
      }
      for (const node of this.networkData.cancerNodes) {
        if (!this.getNodeDegree(node.graphId)) {
          addedNodes.push(this.explorerData.mapCancerDriverGeneToNode(node));
        }
      }
      this.explorerData.activeNetwork.nodeData.nodes.add(addedNodes);
    }
  }

}
