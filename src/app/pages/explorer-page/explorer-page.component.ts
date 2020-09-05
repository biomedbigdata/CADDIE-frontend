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
  Dataset,
  Tissue,
  CancerType,
  DataLevel
} from '../../interfaces';
import {Network, getDatasetFilename} from '../../main-network';
import {HttpClient, HttpParams} from '@angular/common/http';
import {AnalysisService} from '../../analysis.service';
import html2canvas from 'html2canvas';
import {environment} from '../../../environments/environment';
import {NetworkSettings} from '../../network-settings';
import {ControlService} from '../../control.service'


declare var vis: any;


@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})
export class ExplorerPageComponent implements OnInit, AfterViewInit {

  // level of display, either gene-gene interactions or protein-protein
  public selectedDataLevel: DataLevel

  public showDetails = false;
  public selectedWrapper: Wrapper | null = null;

  public collapseAnalysisQuick = true;
  public collapseAnalysis = false;
  public collapseDetails = true;
  public collapseTask = true;
  public collapseSelection = true;
  public collapseBaitFilter = true;
  public collapseQuery = true;
  public collapseData = true;
  public collapseOverview = true;
  public collapseType = true;
  public collapseLevel = true;

  public datasetItems: Dataset[];
  public cancerTypes: CancerType[];
  public selectedDataset: Dataset;
  // in comparison to "selectedDataset", "selectedCancerTypeItems" has to be a list
  public selectedCancerTypeItems: CancerType[];

  public cancerNodesCheckboxes: Array<{ checked: boolean; data: CancerNode }> = [];

  public networkData: Network;

  public nodes: Node[];
  public cancerNodes: CancerNode[];
  public interactions: Interaction[];

  // supplementary data that can be added to network but is not initially loaded to keep it simple and fast
  public nodesSup: Node[];
  public cancerNodesSup: CancerNode[];
  public interactionsSup: Interaction[];

  private network: any;
  public nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  private dumpPositions = true;
  public physicsEnabled = false;

  public queryItems: Wrapper[] = [];
  public filterAddItems: Wrapper[] = [];
  public showAnalysisDialog = false;
  public showThresholdDialog = false;
  public analysisDialogTarget: 'drug' | 'drug-target';

  public showCustomGenesDialog = false;

  public selectedAnalysisToken: string | null = null;

  public currentDataset:Dataset = undefined;
  public currentCancerTypeItems:CancerType[] = undefined;

  //public datasetItems: Dataset[] = undefined;
  public cancerTypeItems: CancerType[] = undefined;

  public currentViewGenes: Node[];
  public currentViewCancerNodes: CancerNode[];
  public currentViewSelectedTissue: Tissue | null = null;
  public currentViewNodes: any[];
  public currentDataLevel: DataLevel

  public expressionExpanded = false;
  public selectedTissue: Tissue | null = null;


  @ViewChild('network', {static: false}) networkEl: ElementRef;

  constructor(private http: HttpClient, public analysis: AnalysisService, private control: ControlService) {

    this.showDetails = false;

    this.analysis.subscribeList((items, selected) => {
      if (!this.nodeData.nodes) {
        return;
      }
      if (selected !== null) {
        if (items.length === 0) {
          return;
        }
        let updatedNodes = [];
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
            true,
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
            true,
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
  }

  async ngAfterViewInit() {
    /**
     * Initializes Explorer Page
     */

    if (!this.datasetItems) {
      // cancer datasets are always loaded
      await this.initCancerDatasets()
    }

    if (!this.cancerTypes) {
      // cancer types are always loaded
      await this.initCancerTypes(this.selectedDataset)

    }

    if (!this.selectedDataLevel) {
      // data level is always set
      this.selectedDataLevel = 'gene'
    }

    // init network if this.network is not set
    if (!this.network) {
      // default selection
      this.selectedCancerTypeItems = [this.cancerTypes[0]];
      await this.createNetwork(this.selectedDataset, this.selectedDataLevel, this.selectedCancerTypeItems);
      this.physicsEnabled = false;
    }
  }

  public async initCancerDatasets() {
    /**
     * Fetches Cancer Dataset data from API and initializes dataset tile
     */
    this.datasetItems = await this.control.getCancerDatasets();
    this.selectedDataset = this.datasetItems[0];

  }

  public async initCancerTypes(dataset: Dataset) {
    /**
     * Fetches Cancer Type data from API and initializes cancer type tile
     */
    this.cancerTypes = await this.control.getCancerTypes(dataset);
    this.selectedCancerTypeItems = [this.cancerTypes[1]]

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

  public async openSummary(item: Wrapper, zoom: boolean) {
    /**
     * Zooms to node in network via zoomToNode() and opens the info tile with node information
     * +
     * sets selectedWrapper to given item
     */
    this.selectedWrapper = item;
    if (zoom) {
      this.zoomToNode(item.nodeId);
    }
    this.showDetails = true;
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

  private async getNetwork(dataset: Dataset, dataLevel: DataLevel, cancerTypes: CancerType[]) {
    /**
     * Fetches Network data from API
     */
    const data = await this.control.getNetwork(dataset, dataLevel, cancerTypes)

    this.nodes = data.nodes;
    this.nodesSup = data.nodesSup;
    this.cancerNodes = data.cancerNodes;
    this.cancerNodesSup = data.cancerNodesSup;
    this.interactions = data.interactions;
    this.interactionsSup = data.interactionsSup;

    this.currentDataset = dataset;
    this.currentCancerTypeItems = cancerTypes;
    this.currentDataLevel = dataLevel;
  }

  public async createNetwork(dataset: Dataset, dataLevel: DataLevel, cancerType: CancerType[]) {
    /**
     * uses getNetwork() to fetch network data
     * +
     * initializes network
     */
    this.analysis.resetSelection();
    this.selectedWrapper = null;

    // fetch all relevant network data and store it in component
    // genes are returned alphabetically
    await this.getNetwork(dataset, dataLevel, cancerType);

    this.networkData = new Network(this.nodes, this.cancerNodes, this.interactions);
    if (!this.dumpPositions) {
      await this.networkData.loadPositionsFromFile(this.http, dataset);
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
    this.filterNodes();

    const container = this.networkEl.nativeElement;
    const options = NetworkSettings.getOptions('main');

    this.network = new vis.Network(container, this.nodeData, options);
    this.network.on('doubleClick', (properties) => {
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
    });

    this.network.on('click', (properties) => {
      const nodeIds: Array<string> = properties.nodes;
      if (nodeIds.length > 0) {
        const nodeId = nodeIds[0];
        const node = this.nodeData.nodes.get(nodeId);
        const wrapper = node.wrapper;
        this.openSummary(wrapper, false);
      } else {
        this.closeSummary();
      }
    });
    this.network.on('deselectNode', (properties) => {
      this.closeSummary();
    });


    if (this.dumpPositions) {
      // dump positions after they are calculated
      this.network.on('stabilizationIterationsDone', () => {
        // tslint:disable-next-line:no-console
        console.log(`${getDatasetFilename(dataset)}`);
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
    this.fillFilterItems(this.cancerNodesSup)
  }

  public fillFilterItems(cancerNodesSup: CancerNode[], reset: Boolean = true) {
    /**
     * Fills the item options in the filter query menu.
     * Allows user to add new genes to network which were previously not displayed due to loading times
     */
    if (reset) {
      this.filterAddItems = []
    }

    cancerNodesSup.forEach((cancerNode) => {
      this.filterAddItems.push(getWrapperFromCancerNode(cancerNode));
    });

  }

  public fillQueryItems(nodes: Node[], cancerNodes: CancerNode[], reset: Boolean = true) {
    /**
     * fills the queryItems list, relevant for sending queries to the server, related to the query tile
     * +
     * adapts network view respectively such that only relevant nodes and edges are shown
     */

    if (reset) {
      this.queryItems = []
      this.currentViewGenes = [];
      this.currentViewCancerNodes = [];
    }

    let newQueryItems = []

    nodes.forEach((node) => {
      newQueryItems.push(getWrapperFromNode(node));
    });

    cancerNodes.forEach((cancerNode) => {
      newQueryItems.push(getWrapperFromCancerNode(cancerNode));
    });
    console.log(newQueryItems)

    // if item is just pushed directly to queryItems, component does not update
    this.queryItems = [...this.queryItems, ...newQueryItems]

    this.currentViewNodes = this.nodeData.nodes;
    this.currentViewGenes.push(...this.nodes);
    this.currentViewCancerNodes.push(...this.cancerNodes);
  }

  public async addNetworkNode(cancerNode: CancerNode) {
    /**
     * Fetches interactionn information from API and fills information in
     */
    // add edges for node dynamically
    const data = await this.control.getNodeInteractions(
      this.currentDataset,
      this.currentDataLevel,
      this.currentCancerTypeItems,
      cancerNode)

    const edgesToAdd = []
    for (const interaction of data.interactions) {
      edgesToAdd.push(this.mapEdge(interaction))
    }

    // add node dynamically to network
    const node = this.mapCancerDriverGeneToNode(cancerNode);

    // add data to network
    this.nodeData.nodes.add(node);
    this.nodeData.edges.add(edgesToAdd);

    // add data to network interface
    this.networkData.cancerNodes.push(cancerNode)
    this.networkData.edges.push(...data.interactions)

    // TODO just do this for new node to speed up
    this.networkData.linkNodes()

    // TODO not working yet
    this.fillQueryItems([], [cancerNode], false)

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

      // find node which has a , TODO improve time here by storing them in an object for lookup simplification
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
      } else if (found) {
        removeIds.add(nodeId);
      }
    }

    this.nodeData.nodes.remove(Array.from(removeIds.values()));
    this.nodeData.nodes.add(Array.from(addNodes.values()));

    // update query options
    this.fillQueryItems(filteredGenes, filteredCancerDriverGenes);
  }

  public addFilterNode(item: any) {
    if (item) {
      this.cancerNodesCheckboxes.push({
        checked: false,
        data: item.data
      })
    }

    this.addNetworkNode(item.data)

    this.filterAddItems.forEach((wrapper: Wrapper) => {
      if (wrapper.backendId = item.data.backendId) {
        // todo remove item
      }
    })

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

  public updateDataLevel(level) {
    /**
     * Updates the data level variable if button is pressed
     */
    this.selectedDataLevel = level;
  }

  private mapGeneToNode(gene: Node): any {
    /**
     * Creates a network node object out of a given Gene object
     */
    const wrapper = getWrapperFromNode(gene);
    const node = NetworkSettings.getNodeStyle('node', true, this.analysis.inSelection(wrapper));
    let nodeLabel = gene.name;
    if (gene.name.length === 0) {
      nodeLabel = gene.backendId;
    }
    node.label = nodeLabel;
    node.id = wrapper.nodeId;
    node.x = gene.x;
    node.y = gene.y;
    node.wrapper = wrapper;
    node.isCancer = false;
    return node;
  }

  private mapCancerDriverGeneToNode(cancerDriverGene: CancerNode): any {
    /**
     * Creates a network node object out of a given CancerDriverGene object
     */
    const wrapper = getWrapperFromCancerNode(cancerDriverGene);
    const node = NetworkSettings.getNodeStyle('cancerNode', true, this.analysis.inSelection(wrapper));
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

  analysisWindowChanged($event: [any[], [Node[], CancerNode[], Tissue]]) {
    /**
     * Changes view to analysis window if event is given, else uses current data
     */
    if ($event) {
      this.currentViewNodes = $event[0];
      this.currentViewGenes = $event[1][0];
      this.currentViewCancerNodes = $event[1][1];
      this.currentViewSelectedTissue = $event[1][2];
    } else {
      this.currentViewNodes = this.nodeData.nodes;
      this.currentViewGenes = this.nodes;
      this.currentViewCancerNodes = this.cancerNodes;
      this.currentViewSelectedTissue = this.selectedTissue;
    }
  }

  gProfilerLink(): string {
    /**
     * Creates and returns link for Profiler (http://biit.cs.ut.ee/gprofiler/gost)
     * uses collected analysis data (getSelection())
     */
    const queryString = this.analysis.getSelection()
      .filter(wrapper => wrapper.type === 'node')
      .map(wrapper => wrapper.data.proteinAc)
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

  public selectTissue(tissue: Tissue | null) {
    /**
     * Handle tissue button and fetch data based on tissue + manage expression data
     */
    this.expressionExpanded = false;
    if (!tissue) {
      // if no tissue selected, we reset all nodes in network
      this.selectedTissue = null;
      const updatedNodes = [];
      for (const gene of this.nodes) {
        const item = getWrapperFromNode(gene);
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
      this.nodeData.nodes.update(updatedNodes);
    } else {
      // ELSE tissue is selected, fetch data based on min expression value
      this.selectedTissue = tissue;

      const minExp = 0.3;

      const params = new HttpParams().set('tissue', `${tissue.id}`).set('data', JSON.stringify(this.currentDataset));
      this.http.get<any>(
        `${environment.backend}tissue_expression/`, {params})
        .subscribe((levels) => {
          const updatedNodes = [];
          const maxExpr = Math.max(...levels.map(lvl => lvl.level));
          for (const lvl of levels) {
            const item = getWrapperFromNode(lvl.protein);
            const node = this.nodeData.nodes.get(item.nodeId);
            if (!node) {
              continue;
            }
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
            this.nodes.find(gene => getGeneNodeId(gene) === item.nodeId).expressionLevel = lvl.level;
            (node.wrapper.data as Node).expressionLevel = lvl.level;
            updatedNodes.push(node);
          }
          this.nodeData.nodes.update(updatedNodes);
        });

    }

    this.currentViewSelectedTissue = this.selectedTissue;
  }

}
