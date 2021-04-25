import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  Interaction,
  CancerNode,
  Node,
  Wrapper,
  getWrapperFromCancerNode,
  getWrapperFromNode,
  getNodeIdsFromGeneGeneInteraction,
  getCancerDriverGeneNodeId,
  getGeneNodeId,
  ExpressionCancerType,
  CancerType,
  Dataset,
  DiseaseGeneInteraction,
  Disease,
  MutationCancerType
} from '../../interfaces';
import {Network, getDatasetFilename} from '../../main-network';
import {HttpClient} from '@angular/common/http';
import {AnalysisService} from '../../services/analysis/analysis.service';
import html2canvas from 'html2canvas';
import {NetworkSettings} from '../../network-settings';
import {ControlService} from '../../services/control/control.service';
import {LoadingOverlayService} from '../../services/loading-overlay/loading-overlay.service';
import {toast} from 'bulma-toast';
import { Router, ActivatedRoute } from '@angular/router';

declare var vis: any;


@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})
export class ExplorerPageComponent implements OnInit, AfterViewInit {

  public showDetails = false;
  public selectedWrapper: Wrapper | null = null;
  public selectedWrapperCancerTypes: CancerType[] | [] = [];
  public selectedWrapperComorbidities: DiseaseGeneInteraction[] | [] = [];

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

  public datasetItems: Dataset[];
  public interactionGeneDatasetItems: Dataset[];
  public interactionDrugDatasetItems: Dataset[];
  public cancerTypes: CancerType[];
  public selectedDataset: Dataset;
  public selectedCancerTypeComorbidityGraph: {data: any, layout: any} = undefined;
  public selectedInteractionGeneDataset: Dataset;
  public selectedInteractionDrugDataset: Dataset;
  // in comparison to "selectedDataset", "selectedCancerTypeItems" has to be a list
  public selectedCancerTypeItems: CancerType[];

  public cancerNodesCheckboxes: Array<{ checked: boolean; data: CancerNode }> = [];

  public networkData: Network;

  public nodes: Node[];
  public cancerNodes: CancerNode[];
  public interactions: Interaction[];

  // supplementary data that can be added to network but is not initially loaded to keep it simple and fast
  public nodesSup: Node[];
  public nodesTotalN: number;
  public cancerNodesSup: CancerNode[];
  public interactionsSup: Interaction[];
  public interactionsTotalN: number;

  private network: any;
  public nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  private dumpPositions = true;
  public physicsEnabled = false;

  public queryItems: Wrapper[] = [];
  public filterAddItems: Wrapper[] = [];
  public showAnalysisDialog = false;
  public showThresholdDialog = false;
  public showDiseaseSelectionDialog = false;
  public showChangeDiseaseSelectionDialog = false;
  public analysisDialogTarget: 'drug' | 'drug-target';

  public showCustomGenesDialog = false;
  public showChangeCustomGenes = false;

  public showVCFInput = false;
  public showChangeVCFInput = false;
  public triggerTemplateUpdateVCFInput = false;

  public selectedAnalysisToken: string | null = null;
  public visibleAnalysisTab: string | null = null;

  public currentDataset: Dataset = undefined;
  public currentCancerTypeItems: CancerType[] = undefined;
  public currentGeneInteractionDataset: Dataset = undefined;
  public currentDrugInteractionDataset: Dataset = undefined;

  public currentViewGenes: Node[];
  public currentViewCancerGenes: CancerNode[];
  public currentViewSelectedExpressionCancerType: ExpressionCancerType | null = null;
  public currentViewNodes: any[];
  public currentViewEdges: Set<string>;

  public expressionExpanded = false;
  public selectedExpressionCancerType: ExpressionCancerType | null = null;

  public mutationCancerTypesExpanded = false;
  public selectedMutationCancerType: MutationCancerType | null = null;

  public visibleCancerNodeCount = 0;
  public visibleNodeCount = 0;

  public networkFullscreenStatus = false;

  public nCancerGenesInSelectedCancerTypes: number;

  public nodeDegree: number;

  private doubleClickTime: Date = new Date();
  private t0: Date = new Date();
  private threshold = 200;


  @ViewChild('network', {static: false}) networkEl: ElementRef;

  constructor(
    private http: HttpClient,
    public analysis: AnalysisService,
    private control: ControlService,
    private loadingOverlay: LoadingOverlayService,
    private router: Router,
    private route: ActivatedRoute,
  ) {

    this.showDetails = false;

    this.analysis.subscribeList((items, selected) => {
      if (!this.nodeData.nodes) {
        return;
      }
      if (selected !== null) {
        if (items.length === 0) {
          return;
        }
        const updatedNodes = [];
        for (const item of items) {
          const node = this.nodeData.nodes.get(item.nodeId);
          if (!node) {
            continue;
          }
          const pos = this.network.getPositions([item.nodeId]);
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
        this.nodeData.nodes.update(updatedNodes);
      } else {
        const updatedNodes = [];
        this.nodeData.nodes.forEach((node) => {
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
        this.nodeData.nodes.update(updatedNodes);
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.selectedAnalysisToken = params.task;
    });
  }

  async ngAfterViewInit() {
    /**
     * Initializes Explorer Page
     */

    if (!this.datasetItems) {
      // cancer datasets are always loaded
      await this.initCancerDatasets();
    }

    if (!this.interactionGeneDatasetItems) {
      // interaction datasets are always loaded
      await this.initInteractionGeneDatasets();
    }

    if (!this.cancerTypes) {
      // cancer types are always loaded
      await this.initCancerTypes(this.selectedDataset);
    }

    // init network if this.network is not set
    if (!this.network) {
      // default selection
      await this.createNetwork(this.selectedDataset, this.selectedInteractionGeneDataset, this.selectedCancerTypeItems);
      this.physicsEnabled = false;
    }

    if (this.selectedCancerTypeItems) {
      this.loadCancerTypeComorbiditesGraph();
    }

    // load drug interaction datasets, do this at the end since it is not needed right away
    if (!this.interactionDrugDatasetItems) {
      // interaction datasets are always loaded
      await this.initInteractionDrugDatasets();
    }

  }

  public setTaskToken(token: string) {
    // update the url
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { task: token },
        queryParamsHandling: 'merge'
      });

    // update the selectedAnalysisToken which will open the analysis panel
    this.selectedAnalysisToken = token;
  }

  public async initCancerDatasets() {
    /**
     * Fetches Cancer Dataset data from API and initializes dataset tile
     */
    this.datasetItems = await this.control.getCancerDatasets();
    this.selectedDataset = this.datasetItems[0];

  }

  public async initInteractionGeneDatasets() {
    /**
     * Fetches Cancer Dataset data from API and initializes dataset tile
     */
    this.interactionGeneDatasetItems = await this.control.getInteractionGeneDatasets();

    this.selectedInteractionGeneDataset = this.interactionGeneDatasetItems[0];
  }

  public async initInteractionDrugDatasets() {
    /**
     * Fetches Cancer Dataset data from API and initializes dataset tile
     */
    this.interactionDrugDatasetItems = await this.control.getInteractionDrugDatasets();

    this.selectedInteractionDrugDataset = this.interactionDrugDatasetItems[0];
  }

  public async initCancerTypes(dataset: Dataset) {
    /**
     * Fetches Cancer Type data from API and initializes cancer type tile
     */
    this.cancerTypes = await this.control.getCancerTypes(dataset);
    this.selectedCancerTypeItems = [this.cancerTypes[0]];
    // update network if exists
    if (this.network) {
      await this.createNetwork(this.selectedDataset, this.selectedInteractionGeneDataset, this.selectedCancerTypeItems);
      }
    }

  public reset(event) {
    /**
     * Removes all filters from filter tile and calls filterNodes() to show all genes
     */
    const checked = event.target.checked;
    this.cancerNodesCheckboxes.forEach(item => item.checked = checked);
    this.filterNodes();
  }

  private zoomToNode(id: string) {
    /**
     * Zooming in to node in network
     */
    this.nodeData.nodes.getIds(); // TODO what is this line doing? Why do we fetch id's?
    const coords = this.network.getPositions(id)[id];
    if (!coords) {
      return;
    }
    let zoomScale = null;
    if (id.startsWith('eff')) {
      zoomScale = 1.0;
    } else {
      zoomScale = 3.0;
    }
    this.network.moveTo({
      position: {x: coords.x, y: coords.y},
      scale: zoomScale,
      animation: true,
    });
  }

  public wrapCancerNodes(cancerNodes: CancerNode[]): Wrapper[] {
    /**
     * Wraps a list of cancer nodes into wrapper objects
     */
    return cancerNodes.map( (cancerNode) => getWrapperFromCancerNode(cancerNode));
  }

  public async openSummary(item: Wrapper, zoom: boolean) {
    /**
     * Zooms to node in network via zoomToNode() and opens the info tile with node information
     * +
     * sets selectedWrapper to given item
     * +
     * loads cancer types information for selected node from api endpoint
     */

    if (zoom) {
      this.zoomToNode(item.nodeId);
    }

    this.selectedWrapper = item;

    this.getRelatedCancerTypes(this.selectedWrapper);

    this.getComorbidities(this.selectedWrapper);

    this.showDetails = true;
  }

  private async getRelatedCancerTypes(item: Wrapper) {
    const data = await this.control.getRelatedCancerTypes(this.currentDataset, item.data);
    this.selectedWrapperCancerTypes = data.cancerTypes;
  }

  private async getComorbidities(item: Wrapper) {
    const data = await this.control.getComorbidities(item.data);
    this.selectedWrapperComorbidities = data.interactions;
  }

  public async closeSummary() {
    /**
     * Closes info tile
     * +
     * removes selectedWrapper
     */
    this.selectedWrapper = null;
    this.showDetails = false;
  }

  private async getNetwork(dataset: Dataset, interactionDataset: Dataset, cancerTypes: CancerType[]) {
    /**
     * Fetches Network data from API
     */
    const data = await this.control.getNetwork(dataset, interactionDataset, cancerTypes);
    this.nodes = data.nodes;
    this.nodesSup = data.nodesSup;
    this.nodesTotalN = data.nodesTotalN;
    this.cancerNodes = data.cancerNodes;
    this.cancerNodesSup = data.cancerNodesSup;
    this.interactions = data.interactions;
    this.interactionsSup = data.interactionsSup;
    this.interactionsTotalN = data.interactionsTotalN;

    this.currentDataset = dataset;
    this.currentCancerTypeItems = cancerTypes;
    this.currentGeneInteractionDataset = interactionDataset;
  }

  public async createNetwork(dataset: Dataset, interactionDataset: Dataset, cancerType: CancerType[]) {
    /**
     * uses getNetwork() to fetch network data
     * +
     * initializes network
     */
    this.loadingOverlay.addTo('canvas-content');

    // reset old stuff
    this.analysis.resetSelection();
    this.selectedWrapper = null;
    //

    // fetch all relevant network data and store it in component
    // genes are returned alphabetically
    await this.getNetwork(dataset, interactionDataset, cancerType);

    this.networkData = new Network(this.nodes, this.cancerNodes, this.interactions);
    if (!this.dumpPositions) {
      await this.networkData.loadPositionsFromFile(this.http, dataset, cancerType);
    }
    this.networkData.linkNodes();

    // Populate baits
    const cancerDriverGeneNames = [];

    // order cancer driver genes/proteins alphabetically for filter list
    this.networkData.cancerNodes.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    // populate checkboxes
    this.cancerNodesCheckboxes = [];
    this.networkData.cancerNodes.forEach((cancerNode) => {
      const cancerNodeName = cancerNode.name;
      if (cancerDriverGeneNames.indexOf(cancerNodeName) === -1) {
        cancerDriverGeneNames.push(cancerNodeName);
        this.cancerNodesCheckboxes.push({
          checked: false,
          data: cancerNode,
        });
      }
    });

    // get node and edge data for network
    const {nodes, edges} = this.mapDataToNodes(this.networkData);
    this.nodeData.nodes = new vis.DataSet(nodes);
    this.nodeData.edges = new vis.DataSet(edges);

    // add all nodes to query
    this.fillQueryItems(this.nodes, this.cancerNodes);

    // set initial view counts
    this.visibleCancerNodeCount = this.cancerNodes.length;
    this.visibleNodeCount = this.nodes.length;

    const container = this.networkEl.nativeElement;
    const options = NetworkSettings.getOptions('main');

    // destroy old network if exists
    if (this.network !== undefined) {
      this.network.destroy();
    }

    this.network = new vis.Network(container, this.nodeData, options);

    // stop network animation when stable state is reached
    this.network.on('stabilizationIterationsDone', () => {
      this.updatePhysicsEnabled(false);

      // save the positions after stabilization
      const positions = this.network.getPositions();

      // update in network
      this.networkData.updateNodePositions(positions);
      // update in reference
      this.nodeData.nodes.forEach((node) => {
        node.x = positions[node.id].x;
        node.y = positions[node.id].y;
      });

    });


    this.network.on('click', (properties) => {
      this.onClick(properties);
    });

    this.network.on('doubleClick', (properties) => {
      this.doubleClickTime = new Date();
      this.onDoubleClick(properties);
    });


    this.network.on('deselectNode', (properties) => {
      this.closeSummary();
    });

    if (this.dumpPositions) {
      // dump positions after they are calculated
      this.network.on('stabilizationIterationsDone', () => {
        // tslint:disable-next-line:no-console
        console.log(`${getDatasetFilename(dataset, cancerType)}`);
        // tslint:disable-next-line:no-console
        console.log(JSON.stringify(this.network.getPositions()));
      });
      this.network.stabilize();
    }

    if (this.selectedWrapper) {
      this.zoomToNode(this.selectedWrapper.nodeId);
    }

    // fill query items for network search
    this.fillQueryItems(this.nodes, this.cancerNodes);
    if (this.selectedWrapper) {
      this.network.selectNodes([this.selectedWrapper.nodeId]);
    }

    // fill adding option in the filter menu
    this.fillFilterItems(this.cancerNodesSup);

    this.loadingOverlay.removeFrom('canvas-content');
  }

  public fillFilterItems(cancerNodesSup: CancerNode[], reset: boolean = true) {
    /**
     * Fills the item options in the filter query menu.
     * Allows user to add new genes to network which were previously not displayed due to loading times
     */
    if (reset) {
      this.filterAddItems = [];
    }

    cancerNodesSup.forEach((cancerNode) => {
      this.filterAddItems.push(getWrapperFromCancerNode(cancerNode));
    });

  }

  public fillQueryItems(nodes: Node[], cancerNodes: CancerNode[], reset: boolean = true) {
    /**
     * fills the queryItems list, relevant for sending queries to the server, related to the query tile
     * +
     * adapts network view respectively such that only relevant nodes and edges are shown
     */

    if (reset) {
      this.queryItems = [];
      this.currentViewGenes = [];
      this.currentViewCancerGenes = [];
    }

    const newQueryItems = [];

    nodes.forEach((node) => {
      newQueryItems.push(getWrapperFromNode(node));
    });

    cancerNodes.forEach((cancerNode) => {
      newQueryItems.push(getWrapperFromCancerNode(cancerNode));
    });

    // if item is just pushed directly to queryItems, component does not update
    this.queryItems = [...this.queryItems, ...newQueryItems];

    this.currentViewNodes = this.nodeData.nodes;
    this.currentViewGenes.push(...this.nodes);
    this.currentViewCancerGenes.push(...this.cancerNodes);

    if (this.network) {
      this.currentViewEdges = new Set([]);
      this.nodeData.nodes.forEach((node) => {
        for (const edge of this.network.getConnectedEdges(node.id)) {
          this.currentViewEdges.add(edge);
        }
      });
    }
  }

  public onClick(properties) {
    this.t0 = new Date();

    // @ts-ignore
    if (this.t0 - this.doubleClickTime > this.threshold) {
      const $this = this;
      setTimeout(() =>   {
        // @ts-ignore
        if ($this.t0 - $this.doubleClickTime > $this.threshold) {
          $this.doOnClick(properties);
        }
      }, this.threshold);
    }
  }

  public doOnClick(properties) {
    // open summary for node on click
    const nodeIds: Array<string> = properties.nodes;
    if (nodeIds.length > 0) {
      const nodeId = nodeIds[0];
      const node = this.nodeData.nodes.get(nodeId);
      const wrapper = node.wrapper;
      this.openSummary(wrapper, false);
      // this.getNodeDegree(wrapper.nodeId);
    } else {
      this.closeSummary();
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

  public async getNodeDegree(graphId: string) {
    /**
     * returns the node degree of a given node in the current network
     */
    // TODO info tile gets called like many times when opening once
    try {
      // do this just to check if node is in network
      this.network.getPosition(graphId);
      // this function somehow just crashes without throwing an error, a behaviour we cannot catch
      this.nodeDegree = this.network.getConnectedEdges(graphId).length;

    } catch (err) {
      this.nodeDegree = undefined;
    }
  }

  public async filterNodes() {
    /**
     * Function related to the Filter tile
     *
     * Filters all gene data on settings in the filter tile
     * +
     * updates network view
     * +
     * updates query items
     */
    const visibleIds = new Set<string>(this.nodeData.nodes.getIds());

    const removeIds = new Set<string>();
    const addNodes = new Map<string, Node>();

    // show all is true if no checkbox is selected
    const showAll = !this.cancerNodesCheckboxes.find((eff) => eff.checked);

    const connectedGenesIds = new Set<string>();

    const filteredCancerDriverGenes = [];
    this.cancerNodesCheckboxes.forEach((cb) => {

      // TODO improve time here by storing them in an object for lookup simplification
      const cancerDriverGenes: Array<CancerNode> = [];
      this.networkData.cancerNodes.forEach((cancerDriverGene) => {
        if (cancerDriverGene.name === cb.data.name) {
          cancerDriverGenes.push(cancerDriverGene);
        }
      });

      // iterate over found node
      cancerDriverGenes.forEach((cancerDriverGene) => {
        // get node id
        const nodeId = getCancerDriverGeneNodeId(cancerDriverGene);
        // check if node is already visible
        const found = visibleIds.has(nodeId);

        // if node is checked or we wanna show all + it is not yet visible
        if ((cb.checked || showAll) && !found) {
          const node = this.mapCancerDriverGeneToNode(cancerDriverGene);
          addNodes.set(node.id, node);
          // we dont want to show all and it is not checked but displayed
        } else if ((!showAll && !cb.checked) && found) {
          // this.nodeData.nodes.remove(nodeId);
          removeIds.add(nodeId);
        }

        // if checked or we wanna show all, get edges
        if (cb.checked || showAll) {
          filteredCancerDriverGenes.push(cancerDriverGene);
          cancerDriverGene.interactions.forEach((gene) => {
            connectedGenesIds.add(gene.backendId);
          });
        }
      });

    }); // end iteration over checkboxes

    const filteredGenes = [];
    for (const gene of this.networkData.nodes) {
      const nodeId = getGeneNodeId(gene);
      const contains = connectedGenesIds.has(gene.backendId);
      const found = visibleIds.has(nodeId);
      if (contains) {
        filteredGenes.push(gene);

        if (!found) {
          const node = this.mapGeneToNode(gene);
          addNodes.set(node.id, node);
        }
      } else if (found && !showAll) {
        removeIds.add(nodeId);
      }
    }

    this.nodeData.nodes.remove(Array.from(removeIds.values()));
    this.nodeData.nodes.add(Array.from(addNodes.values()));

    this.visibleCancerNodeCount = filteredCancerDriverGenes.length;
    this.visibleNodeCount = filteredGenes.length;

    // update query options
    this.fillQueryItems(filteredGenes, filteredCancerDriverGenes);
  }

  public async addSelectionToNetwork() {
    const selection: Wrapper[] = this.analysis.getSelection();
    const toAdd: Wrapper[] = [];
    selection.forEach( (wrapper) => {
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

    this.loadingOverlay.addTo('canvas-content');

    await this.addNetworkNodes(toAdd);

    this.loadingOverlay.removeFrom('canvas-content');
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
        this.currentDataset,
        this.currentGeneInteractionDataset,
        this.currentCancerTypeItems,
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
        node = this.mapCancerDriverGeneToNode(item as CancerNode);
        cancerNodeItems.push(item);
      } else {
        this.networkData.nodes.push(item as Node);
        node = this.mapGeneToNode(item as Node);
        nodeItems.push(item);
      }
      // add data to network interface
      this.networkData.edges.push(...data.interactions);

      // add data to network
      this.nodeData.nodes.add(node);
    }
    // add node to query items
    this.fillQueryItems(nodeItems, cancerNodeItems, false);

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
    if (this.selectedExpressionCancerType) {
      this.selectExpressionCancerType(this.selectedExpressionCancerType);
    }

    toast({
      message: `${dataList.length} nodes added to the network.`,
      duration: 10000,
      dismissible: true,
      pauseOnHover: true,
      type: 'is-success',
      position: 'top-center',
      animate: {in: 'fadeIn', out: 'fadeOut'}
    });

  }

  public queryAction(item: any) {
    if (item) {
      this.openSummary(item, true);
    }
  }

  public updatePhysicsEnabled(bool) {
    /**
     * Updates network physics settings if button is pressed
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

  private mapGeneToNode(gene: Node): any {
    /**
     * Creates a network node object out of a given Gene object
     */
    const wrapper = getWrapperFromNode(gene);
    const node = NetworkSettings.getNodeStyle('Node', undefined, this.analysis.inSelection(wrapper));
    let nodeLabel = gene.name;
    if (gene.name.length === 0) {
      nodeLabel = gene.backendId;
    }
    node.label = nodeLabel;
    node.id = wrapper.nodeId;
    node.x = gene.x;
    node.y = gene.y;
    node.wrapper = wrapper;
    node.isATCClassL = false;
    return node;
  }

  private mapCancerDriverGeneToNode(cancerDriverGene: CancerNode): any {
    /**
     * Creates a network node object out of a given CancerDriverGene object
     */

    const wrapper = getWrapperFromCancerNode(cancerDriverGene);
    const node = NetworkSettings.getNodeStyle('CancerNode', undefined, this.analysis.inSelection(wrapper));
    node.id = wrapper.nodeId;
    node.label = cancerDriverGene.name;
    node.x = cancerDriverGene.x;
    node.y = cancerDriverGene.y;
    node.wrapper = wrapper;
    return node;
  }

  private mapEdge(edge: Interaction): any {
    /**
     * Creates a network edge object out of a given GeneGeneInteraction object
     */
    const {from, to} = getNodeIdsFromGeneGeneInteraction(edge);
    return {
      from, to,
      color: {
        color: NetworkSettings.getColor('edgeGene'),
        highlight: NetworkSettings.getColor('edgeGeneHighlight')
      },
    };
  }

  private mapDataToNodes(data: Network): { nodes: any[], edges: any[] } {
    /**
     * Maps raw network data to network node and gene objects by using
     * mapGeneToNode(), mapCancerDriverGeneToNode() and mapEdge()
     *
     * Returns edges and node objects
     */
    const nodes = [];
    const edges = [];

    for (const gene of data.nodes) {
      nodes.push(this.mapGeneToNode(gene));
    }

    for (const cdg of data.cancerNodes) {
      nodes.push(this.mapCancerDriverGeneToNode(cdg));
    }

    for (const edge of data.edges) {
      edges.push(this.mapEdge(edge));
    }

    return {
      nodes,
      edges,
    };
  }

  public toCanvas() {
    /**
     * prints the network to canvas and downloads it
     */
    html2canvas(this.networkEl.nativeElement).then((canvas) => {
      const generatedImage = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = `Network.png`; // TODO integrate cancer type and cancer dataset into name
      a.click();
    });
  }

  analysisWindowChanged($event: [any[], [Node[], CancerNode[], ExpressionCancerType]]) {
    /**
     * Changes view to analysis window if event is given, else uses current data
     */
    if ($event) {
      this.closeSummary();
      this.currentViewNodes = $event[0];
      this.currentViewGenes = $event[1][0];
      this.currentViewCancerGenes = $event[1][1];
      this.currentViewSelectedExpressionCancerType = $event[1][2];
    } else {
      this.currentViewNodes = this.nodeData.nodes;
      this.currentViewGenes = this.nodes;
      this.currentViewCancerGenes = this.cancerNodes;
      this.currentViewSelectedExpressionCancerType = this.selectedExpressionCancerType;
    }
  }

  gProfilerLink(): string {
    /**
     * Creates and returns link for Profiler (http://biit.cs.ut.ee/gprofiler/gost)
     * uses collected analysis data (getSelection())
     */
    const queryString = this.analysis.getSelection()
      .filter(wrapper => wrapper.type === 'Node' || wrapper.type === 'CancerNode')
      .map(wrapper => wrapper.data.entrezId)
      .join('%0A');
    return 'http://biit.cs.ut.ee/gprofiler/gost?' +
      'organism=hsapiens&' +
      `query=${queryString}&` +
      'ordered=false&' +
      'all_results=false&' +
      'no_iea=false&' +
      'combined=false&' +
      'measure_underrepresentation=false&' +
      'domain_scope=annotated&' +
      'significance_threshold_method=g_SCS&' +
      'user_threshold=0.05&' +
      'numeric_namespace=ENTREZGENE_ACC&' +
      'sources=GO:MF,GO:CC,GO:BP,KEGG,TF,REAC,MIRNA,HPA,CORUM,HP,WP&' +
      'background=';
  }

  public networkFullscreen() {
    /**
     * Either sets network to fullscreen mode or back to normal mode
     */

    // get network element
    const element = document.getElementById('network');

    // either add or remove class 'fullscreen' with settings for fullscreen network
    this.networkFullscreenStatus ? element.classList.remove('fullscreen') : element.classList.add('fullscreen');

    // set this.networkFullscreenStatus
    this.networkFullscreenStatus = !this.networkFullscreenStatus;

    // adapt network to new layout
    this.network.redraw();
  }

  public async colorMutationGradient(mutationCancerType: MutationCancerType | null) {
    /**
     * Handle mutation button and colors the node based on nMutations
     */

    // remove potential expressionCancerType selection
    this.selectedMutationCancerType = mutationCancerType;
    this.selectedExpressionCancerType = null;

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

  public selectExpressionCancerType(expressionCancerType: ExpressionCancerType | null) {
    /**
     * Handle expressionCancerType button and fetch data based on expressionCancerType + manage expression data
     */
    // remove potential mutation gradient selection

    this.selectedMutationCancerType = null;
    this.expressionExpanded = false;

    if (!expressionCancerType) {
      // if no expressionCancerType selected, we reset all nodes in network
      this.selectedExpressionCancerType = null;
      // reset each normal genes and cancer genes
      const updatedNodes = [
        ...this._resetNetworkColorGradient('Node'),
        ...this._resetNetworkColorGradient('CancerNode')
      ];
      this.nodeData.nodes.update(updatedNodes);

    } else {
      // ELSE expressionCancerType is selected, fetch data based on min expression value
      this.selectedExpressionCancerType = expressionCancerType;

      const minExp = 0.3;
      // fetch all data
      this.control.expressionCancerTypeExpressionGenes(expressionCancerType, this.nodes, this.cancerNodes)
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

    this.currentViewSelectedExpressionCancerType = this.selectedExpressionCancerType;
  }

  private _resetNetworkColorGradient(nodeType: ('Node' | 'CancerNode')): Node[] {
    /**
     * resets the color gradient from expressionCancerType expression to normal network colors
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
      const gradient = lvl.level !== null ? ( Math.pow( lvl.level / maxExpr, 1 / 3 ) ) : -1;
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

  public async loadCancerTypeComorbiditesGraph() {
    // TODO gets just one cancer type data
    if (this.selectedCancerTypeItems !== undefined && this.selectedCancerTypeItems.length > 0) {
      const data = await this.control.getComorbiditiesForCancerType(
        this.selectedDataset,
        this.selectedCancerTypeItems,
      );
      this.nCancerGenesInSelectedCancerTypes = data.nCancerGenes;
      const k = 5;

      // get the top 5 occuring diseases (can be more if counts are the same, list will be cropped later)
      const counts = Object.values(data.counts);
      // sort in descending order
      counts.sort((a: number, b: number) => b - a );
      const highestValues = counts.slice(0, k);
      // iterate over data to filter out top k counts
      const keys = [];
      const values = [];
      const diseaseObjects: Disease[] = [];
      for (let[key, val] of Object.entries(data.counts)) {

        // if val is among highest counts
        if (highestValues.includes(val)) {
          // TODO do this when inserting in db
          // split key on comma
          key = key.includes(',') ? key.split(',')[0] : key;

          // replace every third white space with linebreak
          let nth = 0;

          // collect disease objects for on click callback
          diseaseObjects.push(data.diseaseObjects[key]);

          key = key.replace(/\s/g, (match, i, original) => {
            nth++;
            if (nth === 3) {
              nth = 0;
              return '&nbsp;<br>';
            } else {
              return match;
            }
          });
          keys.push(key + '&nbsp;');
          values.push(val);
        }
      }

      // make sure that lists are just k long, this might not be given if we have duplicates in the highest values
      // drop possible more values
      keys.length = k;
      values.length = k;

      // set title dynmically based on amount of selected cancer types
      let title = '';
      if (this.selectedCancerTypeItems.length > 1) {
        title = 'Comorbidities in selected Cancer Types';
      } else {
        title = `Comorbidities in ${this.selectedCancerTypeItems[0].name}`;
      }
      // title += `<br> (${this.nCancerGenesInSelectedCancerTypes} Cancer Genes)`;

      const graphData = {
        data: [
          { y: keys,
            x: values,
            diseaseObjects,
            type: 'bar',
            orientation: 'h',
            transforms: [{
              type: 'sort',
              target: 'x',
              order: 'ascending'
            }],
            marker: {
              color: '#8c4c8c'
            }},
        ],

        layout: {
          title: `${title}`,
          margin: {
            l: 200
          },
          xaxis: {
            title: 'Common Cancer Genes',
          }
        },
        config: {
          responsive: true
        }
      };

      this.selectedCancerTypeComorbidityGraph = graphData;
    } else {
      this.selectedCancerTypeComorbidityGraph = undefined;
    }
  }

  public async addVisibleGenesBasedOnComorbidity(disease: Disease) {
    /**
     * Marking genes as selected if they occur in selected diseases.
     * Looks up all genes in current network.
     */
    const result = await this.control.queryDiseaseGenesByGenes(
      [disease],
      this.currentViewGenes,
      this.currentViewCancerGenes
    );
    this.analysis.addDiseaseGenes(
      this.currentViewNodes, this.currentViewGenes, result.inDiseasesGenes, 'Node');
    this.analysis.addDiseaseGenes(
      this.currentViewNodes, this.currentViewCancerGenes, result.inDiseasesCancerGenes, 'CancerNode');
  }


}
