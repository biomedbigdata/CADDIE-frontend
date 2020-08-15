import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  GeneDriverInteraction,
  CancerDriverGene,
  Gene,
  Wrapper,
  getWrapperFromCancerDriverGene,
  getWrapperFromGene,
  getNodeIdsFromGeneDriverGeneInteraction,
  getCancerDriverGeneNodeId,
  getGeneNodeId,
  Dataset,
  Tissue,
  CancerType
} from '../../interfaces';
import {GeneNetwork, getDatasetFilename} from '../../main-network';
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
  public dataLevel: 'gene' | 'protein'

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

  public cancerDriverGenesCheckboxes: Array<{ checked: boolean; data: CancerDriverGene }> = [];

  public geneData: GeneNetwork;

  public genes: any;
  public cancerDriverGenes: any;
  public interactions: any;

  private network: any;
  public nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  private dumpPositions = true;
  public physicsEnabled = false;

  public queryItems: Wrapper[] = [];
  public showAnalysisDialog = false;
  public showThresholdDialog = false;
  public analysisDialogTarget: 'drug' | 'drug-target';

  public showCustomProteinsDialog = false;

  public selectedAnalysisToken: string | null = null;

  public currentDataset:Dataset = undefined;
  public currentCancerType:CancerType = undefined;

  //public datasetItems: Dataset[] = undefined;
  public cancerTypeItems: CancerType[] = undefined;

  public currentViewGenes: Gene[];
  public currentViewCancerDriverGenes: CancerDriverGene[];
  public currentViewSelectedTissue: Tissue | null = null;
  public currentViewNodes: any[];

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
      await this.initCancerTypes()
    }

    if (!this.dataLevel) {
      // data level is always set
      this.dataLevel = 'gene'
    }

    // init network if this.network is not set
    if (!this.network) {
      // default selection
      this.selectedDataset = this.datasetItems[0];
      this.selectedCancerTypeItems = [this.cancerTypes[10]];
      await this.createNetwork(this.selectedDataset, this.selectedCancerTypeItems);
      this.physicsEnabled = false;
    }
  }

  private async initCancerDatasets() {
    /**
     * Fetches Cancer Dataset data from API and initializes dataset tile
     */
    this.datasetItems = await this.control.getCancerDatasets();

  }

  private async initCancerTypes() {
    /**
     * Fetches Cancer Type data from API and initializes cancer type tile
     */
    this.cancerTypes = await this.control.getCancerTypes();

  }

  public reset(event) {
    /**
     * Removes all filters from filter tile and calls filterNodes() to show all genes
     */
    const checked = event.target.checked;
    this.cancerDriverGenesCheckboxes.forEach(item => item.checked = checked);
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

  private async getNetwork(dataset: Dataset, cancerTypes: CancerType[]) {
    /**
     * Fetches Network data from API
     */
    this.currentDataset = dataset;
    this.selectedCancerTypeItems = cancerTypes;
    const data = await this.control.getNetwork(dataset, cancerTypes)

    this.genes = data.genes;
    this.cancerDriverGenes = data.cancerDriverGenes;
    this.interactions = data.interactions;
  }

  public async createNetwork(dataset: Dataset, cancerType: CancerType[]) {
    /**
     * uses getNetwork() to fetch network data
     * +
     * initializes network
     */
    this.analysis.resetSelection();
    this.selectedWrapper = null;

    // fetch all relevant network data and store it in component
    // genes are returned alphabetically
    await this.getNetwork(dataset, cancerType);

    this.geneData = new GeneNetwork(this.genes, this.cancerDriverGenes, this.interactions);
    if (!this.dumpPositions) {
      await this.geneData.loadPositionsFromFile(this.http, dataset);
    }
    this.geneData.linkNodes();

    // Populate baits
    const cancerDriverGeneNames = [];
    console.log(this.geneData)

    // populate checkboxes
    this.cancerDriverGenesCheckboxes = [];
    this.geneData.cancer_driver_genes.forEach((cancerDriverGene) => {
      const cancerDriverGeneName = cancerDriverGene.geneName;
      if (cancerDriverGeneNames.indexOf(cancerDriverGeneName) === -1) {
        cancerDriverGeneNames.push(cancerDriverGeneName);
        this.cancerDriverGenesCheckboxes.push({
          checked: false,
          data: cancerDriverGene,
        });
      }
    });

    const {nodes, edges} = this.mapDataToNodes(this.geneData);
    this.nodeData.nodes = new vis.DataSet(nodes);
    this.nodeData.edges = new vis.DataSet(edges);

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

    this.queryItems = [];
    this.fillQueryItems(this.genes, this.cancerDriverGenes);
    if (this.selectedWrapper) {
      this.network.selectNodes([this.selectedWrapper.nodeId]);
    }
  }

  public fillQueryItems(genes: Gene[], cancerGenes: CancerDriverGene[]) {
    /**
     * fills the queryItems list, relevant for sending queries to the server, related to the query tile
     * +
     * adapts network view respectively such that only relevant nodes and edges are shown
     */
    this.queryItems = [];
    genes.forEach((gene) => {
      this.queryItems.push(getWrapperFromGene(gene));
    });

    cancerGenes.forEach((cancer_gene) => {
      this.queryItems.push(getWrapperFromCancerDriverGene(cancer_gene));
    });

    this.currentViewNodes = this.nodeData.nodes;
    this.currentViewGenes = this.genes;
    this.currentViewCancerDriverGenes = this.cancerDriverGenes;
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

    const showAll = !this.cancerDriverGenesCheckboxes.find((eff) => eff.checked);
    const connectedGenesIds = new Set<string>();

    const filteredCancerDriverGenes = [];
    this.cancerDriverGenesCheckboxes.forEach((cb) => {
      const cancerDriverGenes: Array<CancerDriverGene> = [];
      this.geneData.cancer_driver_genes.forEach((cancerDriverGene) => {
        if (cancerDriverGene.geneName === cb.data.geneName) {
          cancerDriverGenes.push(cancerDriverGene);
        }
      });
      cancerDriverGenes.forEach((cancerDriverGene) => {
        const nodeId = getCancerDriverGeneNodeId(cancerDriverGene);
        const found = visibleIds.has(nodeId);
        if ((cb.checked || showAll) && !found) {
          const node = this.mapCancerDriverGeneToNode(cancerDriverGene);
          // this.nodeData.nodes.add(node);
          addNodes.set(node.id, node);
        } else if ((!showAll && !cb.checked) && found) {
          // this.nodeData.nodes.remove(nodeId);
          removeIds.add(nodeId);
        }
        if (cb.checked || showAll) {
          filteredCancerDriverGenes.push(cancerDriverGene);
          cancerDriverGene.interactions.forEach((gene) => {
            connectedGenesIds.add(gene.id);
          });
        }
      });
    });
    const filteredGenes = [];
    for (const gene of this.geneData.genes) {
      const nodeId = getGeneNodeId(gene);
      const contains = connectedGenesIds.has(gene.id);
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
    this.fillQueryItems(filteredGenes, filteredCancerDriverGenes);
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
    this.dataLevel = level;
  }

  private mapGeneToNode(gene: Gene): any {
    /**
     * Creates a network node object out of a given Gene object
     */
    const wrapper = getWrapperFromGene(gene);
    const node = NetworkSettings.getNodeStyle('gene', true, this.analysis.inSelection(wrapper));
    let nodeLabel = gene.name;
    if (gene.name.length === 0) {
      nodeLabel = gene.id;
    }
    node.label = nodeLabel;
    node.id = wrapper.nodeId;
    node.x = gene.x;
    node.y = gene.y;
    node.wrapper = wrapper;
    return node;
  }

  private mapCancerDriverGeneToNode(cancerDriverGene: CancerDriverGene): any {
    /**
     * Creates a network node object out of a given CancerDriverGene object
     */
    const wrapper = getWrapperFromCancerDriverGene(cancerDriverGene);
    const node = NetworkSettings.getNodeStyle('cancerDriverGene', true, this.analysis.inSelection(wrapper));
    node.id = wrapper.nodeId;
    node.label = cancerDriverGene.geneName;
    node.id = wrapper.nodeId;
    node.x = cancerDriverGene.x;
    node.y = cancerDriverGene.y;
    node.wrapper = wrapper;
    return node;
  }

  private mapEdge(edge: GeneDriverInteraction): any {
    /**
     * Creates a network edge object out of a given GeneDriverInteraction object
     */
    const {from, to} = getNodeIdsFromGeneDriverGeneInteraction(edge);
    return {
      from, to,
      color: {
        color: NetworkSettings.getColor('edgeGeneCancerDriverGene'),
        highlight: NetworkSettings.getColor('edgeGeneCancerDriverGeneHighlight')
      },
    };
  }

  private mapDataToNodes(data: GeneNetwork): { nodes: any[], edges: any[] } {
    /**
     * Maps raw netowrk data to network nobde and gene objects by using
     * mapGeneToNode(), mapCancerDriverGeneToNode() and mapEdge()
     *
     * Returns edges and node objects
     */
    const nodes = [];
    const edges = [];

    for (const gene of data.genes) {
      nodes.push(this.mapGeneToNode(gene));
    }

    for (const effect of data.cancer_driver_genes) {
      nodes.push(this.mapCancerDriverGeneToNode(effect));
    }

    for (const edge of data.edges) {
      edges.push(this.mapEdge(edge));
    }

    return {
      nodes,
      edges,
    };
  }

  public buttonNetworkSubmit() {
    console.log("submit")

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

  analysisWindowChanged($event: [any[], [Gene[], CancerDriverGene[], Tissue]]) {
    /**
     * Changes view to analysis window if event is given, else uses current data
     */
    if ($event) {
      this.currentViewNodes = $event[0];
      this.currentViewGenes = $event[1][0];
      this.currentViewCancerDriverGenes = $event[1][1];
      this.currentViewSelectedTissue = $event[1][2];
    } else {
      this.currentViewNodes = this.nodeData.nodes;
      this.currentViewGenes = this.genes;
      this.currentViewCancerDriverGenes = this.cancerDriverGenes;
      this.currentViewSelectedTissue = this.selectedTissue;
    }
  }

  gProfilerLink(): string {
    /**
     * Creates and returns link for Profiler (http://biit.cs.ut.ee/gprofiler/gost)
     * uses collected analysis data (getSelection())
     */
    const queryString = this.analysis.getSelection()
      .filter(wrapper => wrapper.type === 'gene')
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
      for (const gene of this.genes) {
        const item = getWrapperFromGene(gene);
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
        (node.wrapper.data as Gene).expressionLevel = undefined;
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
            const item = getWrapperFromGene(lvl.protein);
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
            this.genes.find(gene => getGeneNodeId(gene) === item.nodeId).expressionLevel = lvl.level;
            (node.wrapper.data as Gene).expressionLevel = lvl.level;
            updatedNodes.push(node);
          }
          this.nodeData.nodes.update(updatedNodes);
        });

    }

    this.currentViewSelectedTissue = this.selectedTissue;
  }

}
