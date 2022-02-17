import { Injectable } from '@angular/core';
import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsoleService } from '@ng-select/ng-select/lib/console.service';
import { CancerNode, CancerType, Dataset, Disease, DiseaseGeneInteraction, Drug, ExpressionCancerType, getNodeIdsFromGeneGeneInteraction, getWrapperFromCancerNode, getWrapperFromDrugNode, getWrapperFromNode, Interaction, MutationCancerType, NetworkType, Node, Tissue, Wrapper } from 'src/app/interfaces';
import { NetworkSettings } from 'src/app/network-settings';
import { AnalysisService } from 'src/app/services/analysis/analysis.service';
import { ControlService } from 'src/app/services/control/control.service';
import { LoadingOverlayService } from '../loading-overlay/loading-overlay.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorerDataService {

  constructor(    
    public analysis: AnalysisService,
    private control: ControlService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingOverlay: LoadingOverlayService
    ) { 
    }

    // explorer information
    public showNetworkMenuDialog = false;
    public showTaskSummarizeDialog = false;
    public showAnalysisDialog = false;
    public showTissueThresholdDialog = false;
    public showCancerThresholdDialog = false;
    public showMutationThresholdDialog = false;
    public showDiseaseSelectionDialog = false;
    public showChangeDiseaseSelectionDialog = false;
    public showVCFInput = false;
    public showCustomGenesDialog = false;
    public showChangeCustomGenes = false;
    public showChangeVCFInput = false;
    public triggerTemplateUpdateVCFInput = false;
    public selectedAnalysisToken: string | null = null;

    // switch between networks, "this" of network component
    public networks = {'basic': null, 'analysis': null};  // contains the network, keys are NetworkType, 'basic' and 'analysis'
    public activeNetwork: any = false;

    // dataset tile
    public datasetItems: Dataset[];

    // info tile
    public selectedWrapper: Wrapper | null = null;
    public selectedWrapperCancerTypes: CancerType[] | [] = [];
    public selectedWrapperComorbidities: DiseaseGeneInteraction[] | [] = [];
    public nodeDegree: Wrapper | null = null;
    public leftSidebarScrollTopButton = false;
  
    // gene interaction dataset tile
    public interactionGeneDatasetItems: Dataset[];
    public selectedInteractionGeneDatasetChange = new EventEmitter<Dataset>();

    // drug interaction dataset dropdown
    public selectedInteractionDrugDataset: Dataset;
    public interactionDrugDatasetItems: Dataset[];

    // mutation cancer type dropdown
    public selectedMutationCancerType: MutationCancerType | null = null;

    // expression cancer type dropdown
    public selectedExpressionCancerType: ExpressionCancerType | null = null;

    // cancertype tile
    public cancerTypes: CancerType[];
    public selectedCancerTypeItemsChange = new EventEmitter<CancerType>();
    public numberGenesInComorbidities: number = null;
  
    // cancertype comorbidities tile
    public selectedCancerTypeComorbidityGraph: {data: any, layout: any} = undefined;
    public addVisibleGenesBasedOnComorbidity = new EventEmitter<Disease>();

    // information for explorer
    public analysisDialogTarget: 'drug' | 'drug-target';
    public analysisDialogTargetChange = new EventEmitter<'drug' | 'drug-target'>();

    // filter tile
    public filterAddItems: Wrapper[] = [];

    public showDetailsChange = new EventEmitter<Wrapper>();
    public visibleItems = new EventEmitter<[any[], [Node[], CancerNode[], ExpressionCancerType]]>();
    public visibleTab = new EventEmitter<string>();

    public init() {
      this.activeNetwork = {};
    }

    public async activate(networkType: NetworkType) {
      if (this.networks[networkType] === null) {
        // analysis network before init
        this.activeNetwork = {};
        return
      }
      this.activeNetwork = this.networks[networkType];
      if (networkType === 'basic' && this.activeNetwork.networkVisJs === null) {
        // for the case user opens webpage on analysis view and then navigates to basic
        await this.initBasicNetwork();
      }
    }

    public openAnalysis(token) {
      /**
       * opens analysis modal
      */
      if (this.selectedAnalysisToken !== null) {
        // in case user jumps from one analysis to another, close previous analysis before opening new one.
        // This resets variables and enables a clean slate.
        this.selectedAnalysisToken = null;
      }
      this.selectedWrapper = null;
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
      // this.networks.analysis = {nodeData: {nodes: [], edges: []}, visibleEdges: [], degrees: {}};
      this.activate('analysis');
      this.analysis.switchSelection(token);
    }

    public closeAnalysis() {
      /**
       * closes analysis modal
      */
      this.selectedWrapper = null;
      // update the url
      this.router.navigate(
        [],
        {
          relativeTo: this.route,
          queryParams: { task: null },
        });
      this.selectedAnalysisToken = null;
      this.activate('basic');
      this.analysis.switchSelection('main');
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

    public async initCancerTypes(dataset: Dataset) {
      /**
       * Fetches Cancer Type data from API and initializes cancer type tile
       */
      this.cancerTypes = await this.control.getCancerTypes(dataset);
      this.activeNetwork.selectedCancerTypeItems = [this.cancerTypes[0]];
      // update network if exists

      if (this.activeNetwork) {
        this.loadingOverlay.addTo('loadingOverlayTarget');
        await this.activeNetwork.getMainNetwork(this.activeNetwork.selectedDataset, 
          this.activeNetwork.selectedInteractionGeneDataset, this.activeNetwork.selectedCancerTypeItems);
        }
        await this.activeNetwork.createNetwork();
        this.loadingOverlay.removeFrom('loadingOverlayTarget');
      await this.activeNetwork.setNetworkDefaultSettings();
      }

      public async initCancerDatasets() {
        /**
         * Fetches Cancer Dataset data from API and initializes dataset tile
         */
        this.datasetItems = this.datasetItems ? this.datasetItems : await this.control.getCancerDatasets();
        this.activeNetwork.selectedDataset = this.datasetItems[0];
      }

      public async initInteractionGeneDatasets() {
        /**
         * Fetches Gene interaction dataset data from API and initializes dataset tile
         */
        this.interactionGeneDatasetItems = await this.control.getInteractionGeneDatasets();

        this.activeNetwork.selectedInteractionGeneDataset = this.interactionGeneDatasetItems[0];
      }
    
      public async initInteractionDrugDatasets() {
        /**
         * Fetches drug interaction dataset data from API and initializes dataset tile
         */
        this.interactionDrugDatasetItems = await this.control.getInteractionDrugDatasets();
        console.log(this.interactionDrugDatasetItems)
        this.activeNetwork.selectedInteractionDrugDataset = this.interactionDrugDatasetItems[0];
      }

    public mapGeneToNode(gene: Node): any {
      /**
       * Creates a network node object out of a given Gene object
       */
      const wrapper = getWrapperFromNode(gene);
      const node = NetworkSettings.getNodeStyle(
        'Node', this.activeNetwork.isSeed[wrapper.data.graphId], this.analysis.inSelection(wrapper));
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

    public mapCancerDriverGeneToNode(cancerDriverGene: CancerNode): any {
      /**
       * Creates a network node object out of a given CancerDriverGene object
       */
  
      const wrapper = getWrapperFromCancerNode(cancerDriverGene);
      const node = NetworkSettings.getNodeStyle(
        'CancerNode', this.activeNetwork.isSeed[wrapper.data.graphId], this.analysis.inSelection(wrapper));
      node.id = wrapper.nodeId;
      node.label = cancerDriverGene.name;
      node.x = cancerDriverGene.x;
      node.y = cancerDriverGene.y;
      node.wrapper = wrapper;
      return node;
    }

    public deselectSelectedWrapper() {
      this.selectedWrapper = null;
    }

    public async getBasicNetwork(
      dataset: Dataset, 
      interactionDataset: Dataset, 
      cancerTypes: CancerType[]
      ) {
      /**
       * Fetches Network data from API
       */
      const data = await this.control.getNetwork(dataset, interactionDataset, cancerTypes);
      // this.activeNetwork.nodes = data.nodes;
      this.activeNetwork.basicNodes = data.nodes;
      this.activeNetwork.cancerNodes = data.cancerNodes;
      this.activeNetwork.cancerNodesSup = data.cancerNodesSup
      this.activeNetwork.interactions = data.interactions;

      this.activeNetwork.selectedDataset = dataset;
      this.activeNetwork.selectedCancerTypeItems = cancerTypes;
      this.activeNetwork.selectedInteractionGeneDataset = interactionDataset;
    }

    public closeSummary() {
      this.selectedWrapper = null;
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
        this.activeNetwork.zoomToNode(item.nodeId);
      }
  
      this.selectedWrapper = item;
  
      this.getRelatedCancerTypes(this.selectedWrapper);
  
      this.getComorbidities(this.selectedWrapper);
  
      // if left sidebar is scrolled down, offer user to scroll up
      if (document.getElementById('left-sidebar').scrollTop) {
        this.leftSidebarScrollTopButton = true;
        // setTimeout(() => this.leftSidebarScrollTopButton = false, 1000);
      }
    }
  
    public queryAction(item: any) {
      if (item) {
        this.openSummary(item, true);
      }
    }
  
    public fillQueryItems(nodes: Node[], cancerNodes: CancerNode[], drugNodes: Drug[], reset: boolean = true) {
      /**
       * fills the queryItems list, relevant for sending queries to the server, related to the query tile
       * +
       * adapts network view respectively such that only relevant nodes and edges are shown
       */
      if (reset) {
        this.activeNetwork.queryItems = [];
        this.activeNetwork.currentViewNodes = [];
        this.activeNetwork.currentViewCancerNodes = [];
      }

      const newQueryItems = [];
  
      nodes.forEach((node) => {
        newQueryItems.push(getWrapperFromNode(node));
      });
  
      cancerNodes.forEach((cancerNode) => {
        newQueryItems.push(getWrapperFromCancerNode(cancerNode));
      });

      drugNodes.forEach((drugNode) => {
        newQueryItems.push(getWrapperFromDrugNode(drugNode));
      });

      // if item is just pushed directly to queryItems, component does not update
      this.activeNetwork.queryItems = [...this.activeNetwork.queryItems, ...newQueryItems];
      this.activeNetwork.nodes = this.activeNetwork.nodeData.nodes;
      // TODO
      // this.activeNetwork.currentViewNodes.push(...this.activeNetwork.basicNodes);
      this.activeNetwork.currentViewCancerNodes.push(...this.activeNetwork.cancerNodes);
      this.activeNetwork.visibleEdges = new Set([]);
      this.activeNetwork.nodeData.nodes.forEach((node) => {
        for (const edge of this.activeNetwork.networkVisJs.getConnectedEdges(node.id)) {
          this.activeNetwork.visibleEdges.add(edge);
        }
      });
    }

    private async getRelatedCancerTypes(item: Wrapper) {
      const data = await this.control.getRelatedCancerTypes(this.activeNetwork.selectedDataset, item.data);
      // order alphabetically
      data.cancerTypes.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      this.selectedWrapperCancerTypes = data.cancerTypes;
    }
  
    private async getComorbidities(item: Wrapper) {
      const data = await this.control.getComorbidities(item.data);
      // order alphabetically
      data.interactions.sort((a, b) => {
        return a.diseaseName.localeCompare(b.diseaseName);
      });
      this.selectedWrapperComorbidities = data.interactions;
    }
  
    public exampleSearch(target: 'drug' | 'drug-target') {
  
      // get seed genes if selected, otherwise all cancer genes
      const parameters: any = {};
      const selection = this.analysis.getSelection();
      if (selection.length) {
        // get selected genes as seeds
        parameters.seeds = selection.map((item) => this.analysis.getGraphId(item));
      } else {
        // get all cancer driver genes as seeds
        parameters.seeds = this.activeNetwork.cancerNodes.map((item) => item.graphId);
      }
  
      // new input from caddie
      parameters.cancer_dataset = 'NCG6';
      // parameters.cancer_dataset_id = this.activeNetwork.selectedDataset.backendId;
      parameters.gene_interaction_datasets = [this.activeNetwork.selectedInteractionGeneDataset.name];
      // parameters.gene_interaction_dataset_id = this.activeNetwork.selectedInteractionGeneDataset.backendId;
      parameters.drug_interaction_datasets = ['DGIdb'];
      // parameters.drug_interaction_dataset_id = this.activeNetwork.selectedInteractionDrugDataset.backendId;
      parameters.cancer_type_names = this.activeNetwork.selectedCancerTypeItems.map( (cancerType) => cancerType.name );
      parameters.includeNutraceuticalDrugs = true;
      parameters.onlyAtcLDrugs = false;
      parameters.filterPaths = true;
      parameters.mutationCancerType = this.activeNetwork.selectedMutationCancerType ? this.activeNetwork.selectedMutationCancerType.abbreviation : null;
      parameters.expressionCancerType = this.activeNetwork.selectedExpressionCancerType ? this.activeNetwork.selectedExpressionCancerType.name : null;
  
      if (target === 'drug-target') {
        // use multisteiner
        parameters.num_trees = 5;
        parameters.include_indirect_drugs = true;
        parameters.include_non_approved_drugs = true;
        parameters.ignore_non_seed_baits = false;
        // parameters.max_deg = 6;
        parameters.hub_penalty = 0;
        parameters.result_size = 10;
        this.analysis.startQuickAnalysis('exampledrugtarget', target, parameters);
      } else if (target === 'drug') {
        // trustrank
        parameters.damping_factor = 0.5;
        parameters.include_indirect_drugs = true;
        parameters.include_non_approved_drugs = true;
        parameters.ignore_non_seed_baits = false;
        // parameters.max_deg = 0;
        parameters.hub_penalty = 0;
        parameters.result_size = 10;
        this.analysis.startQuickAnalysis('exampledrug', target, parameters);
      }
    }

    public async initBasicNetwork() {

      if (this.activeNetwork.networkType !== 'basic') {
        this.activate('basic');
      }
  
      if (!this.activeNetwork.selectedDataset) {
        // cancer datasets are always loaded
        await this.initCancerDatasets();
      }
  
      if (!this.interactionGeneDatasetItems) {
        // interaction datasets are always loaded
        await this.initInteractionGeneDatasets();
      }
      this.activeNetwork.selectedInteractionGeneDataset = this.interactionGeneDatasetItems[0];
  
      if (!this.cancerTypes || this.activeNetwork.selectedCancerTypeItems===undefined) {
        // cancer types are always loaded
        await this.initCancerTypes(this.activeNetwork.selectedDataset);
      }
  
      // init network if network does not exist
      if (!this.activeNetwork.networkVisJs) {
        // default selection
        this.loadingOverlay.addTo('loadingOverlayTarget');
        await this.activeNetwork.getMainNetwork(this.activeNetwork.selectedDataset, this.activeNetwork.selectedInteractionGeneDataset, this.activeNetwork.selectedCancerTypeItems);
        await this.activeNetwork.createNetwork();
        this.loadingOverlay.removeFrom('loadingOverlayTarget');
        await this.activeNetwork.setNetworkDefaultSettings();
  
        this.activeNetwork.physicsEnabled = true;
      }
  
      // load drug interaction datasets, do this at the end since it is not needed right away
      if (!this.interactionDrugDatasetItems) {
        // interaction datasets are always loaded
        await this.initInteractionDrugDatasets();
      }
      this.activeNetwork.selectedInteractionDrugDataset = this.interactionDrugDatasetItems[0];
  
    }
}
