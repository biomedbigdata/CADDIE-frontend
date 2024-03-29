import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  Algorithm,
  AlgorithmType,
  AnalysisService, BETWEENNESS_CENTRALITY, HARMONIC_CENTRALITY,
  DEGREE_CENTRALITY, DOMINO,
  KEYPATHWAYMINER, MAX_TASKS,
  MULTISTEINER, NETWORK_PROXIMITY,
  QuickAlgorithmType,
  TRUSTRANK
} from '../../../../../../services/analysis/analysis.service';
import { CancerType, Dataset, MutationCancerType, ExpressionCancerType, DrugTargetAction } from '../../../../../../interfaces';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';
import { ControlService } from 'src/app/services/control/control.service';

@Component({
  selector: 'app-launch-analysis',
  templateUrl: './launch-analysis.component.html',
  styleUrls: ['./launch-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LaunchAnalysisComponent implements OnInit, OnChanges {

  @Input()
  public show = false;
  @Input()
  public target: 'drug' | 'drug-target';

  @Output()
  public showChange = new EventEmitter<boolean>();

  public selectedDrugTargetAction: DrugTargetAction = null;

  public algorithm: AlgorithmType | QuickAlgorithmType;

  public algorithms: Array<Algorithm> = [];
  public includeNutraceuticalDrugs = true;
  public includeAtcLDrugs = false;
  public includeOnlyCTRPv2Drugs = false;
  public filterPaths = true;

  // DOMINO parameters
  public dominoMaxDeg = 0;

  // Trustrank Parameters
  public trustrankIncludeIndirectDrugs = false;
  public trustrankIncludeNonApprovedDrugs = false;
  public trustrankIncludeCancerNonSeeds = true;
  public trustrankDampingFactor = 0.85;
  public trustrankMaxDeg = 0;
  public trustrankHubPenalty = 0.0;
  public trustrankResultSize = 20;

  // Closeness Parameters
  public closenessIncludeIndirectDrugs = false;
  public closenessIncludeNonApprovedDrugs = false;
  public closenessIncludeViralNonSeeds = true;
  public closenessMaxDeg = 0;
  public closenessHubPenalty = 0.0;
  public closenessResultSize = 20;


  // harmonic Parameters
  public harmonicIncludeIndirectDrugs = false;
  public harmonicIncludeNonApprovedDrugs = false;
  public harmonicIncludeCancerNonSeeds = true;
  public harmonicMaxDeg = 0;
  public harmonicHubPenalty = 0.0;
  public harmonicResultSize = 20;

  // Degree Parameters
  public degreeIncludeNonApprovedDrugs = false;
  public degreeIncludeCancerNonSeeds = true;
  public degreeMaxDeg = 0;
  public degreeResultSize = 20;

  // Network proximity
  public proximityIncludeNonApprovedDrugs = false;
  public proximityMaxDeg = 0;
  public proximityHubPenalty = 0.0;
  public proximityResultSize = 20;

  // Betweenness Parameters
  public betweennessIncludeCancerNonSeeds = true;
  public betweennessMaxDeg = 0;
  public betweennessHubPenalty = 0.0;
  public betweennessResultSize = 20;

  // Keypathwayminer Parameters
  public keypathwayminerK = 5;

  // Multisteiner Parameters
  public multisteinerNumTrees = 5;
  public multisteinerTolerance = 10;
  public multisteinerIncludeCancerNonSeeds = true;
  public multisteinerMaxDeg = 0;
  public multisteinerHubPenalty = 0.0;

  public maxTasks = MAX_TASKS;

  constructor(
    public analysis: AnalysisService,
    public explorerData: ExplorerDataService,
    public control: ControlService
    ) {
  }

  async ngOnInit(): Promise<void> {
    if (!this.explorerData.interactionDrugDatasetItems) {
      this.explorerData.interactionDrugDatasetItems = await this.control.getInteractionDrugDatasets();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.target === 'drug-target') {
      this.algorithms = [MULTISTEINER, KEYPATHWAYMINER, DOMINO, TRUSTRANK, HARMONIC_CENTRALITY, DEGREE_CENTRALITY, BETWEENNESS_CENTRALITY];
      this.algorithm = MULTISTEINER.slug;
    } else if (this.target === 'drug') {
      this.algorithms = [TRUSTRANK, HARMONIC_CENTRALITY, DEGREE_CENTRALITY, NETWORK_PROXIMITY];
      this.algorithm = TRUSTRANK.slug;
    }
  }

  public setSelectedMutationCancerType(cancerType: MutationCancerType) {
    this.explorerData.activeNetwork.selectedMutationCancerType = cancerType;
  }

  public setSelectedExpressionCancerType(expressionCancerType: ExpressionCancerType) {
    this.explorerData.activeNetwork.selectedExpressionCancerType = expressionCancerType;
  }

  public setSelectedDrugTargetAction(drugTargetAction: DrugTargetAction) {
    this.selectedDrugTargetAction = drugTargetAction;
  }

  public close() {
    this.show = false;
    this.explorerData.activeNetwork.selectedMutationCancerType = null;
    this.explorerData.activeNetwork.selectedExpressionCancerType = null;
    this.selectedDrugTargetAction = null;
    this.showChange.emit(this.show);
  }

  public async startTask(
    dataset: Dataset,
    geneInteractionDataset: Dataset,
    drugInteractionDataset: Dataset,
    cancerTypes: CancerType[]
  ) {
    const parameters: any = {
      seeds: this.analysis.getSelection().map((item) => this.analysis.getGraphId(item)),
    };

    // new input from caddie
    parameters.cancer_dataset = dataset.name;
    parameters.gene_interaction_datasets = [geneInteractionDataset.name];
    parameters.drug_interaction_datasets = [drugInteractionDataset.name];
    parameters.cancer_type_names = cancerTypes.map((cancerType) => cancerType.name);
    parameters.includeNutraceuticalDrugs = this.includeNutraceuticalDrugs;
    parameters.onlyAtcLDrugs = this.includeAtcLDrugs;
    parameters.include_only_ctrpv2_drugs = this.includeOnlyCTRPv2Drugs;
    parameters.filterPaths = this.filterPaths;
    parameters.mutationCancerType = this.explorerData.activeNetwork.selectedMutationCancerType ? this.explorerData.activeNetwork.selectedMutationCancerType.name : null;
    parameters.expressionCancerType = this.explorerData.activeNetwork.selectedExpressionCancerType ? this.explorerData.activeNetwork.selectedExpressionCancerType.name : null;
    parameters.drug_target_action = this.selectedDrugTargetAction ? this.selectedDrugTargetAction.name : null;
    
    if (this.algorithm === 'trustrank') {
      parameters.damping_factor = this.trustrankDampingFactor;
      parameters.include_indirect_drugs = this.trustrankIncludeIndirectDrugs;
      parameters.include_non_approved_drugs = this.trustrankIncludeNonApprovedDrugs;
      parameters.ignore_non_seed_baits = !this.trustrankIncludeCancerNonSeeds;
      if (this.trustrankMaxDeg && this.trustrankMaxDeg > 0) {
        parameters.max_deg = this.trustrankMaxDeg;
      }
      parameters.hub_penalty = this.trustrankHubPenalty;
      parameters.result_size = this.trustrankResultSize;
    } else if (this.algorithm === 'harmonic') {
      parameters.include_indirect_drugs = this.harmonicIncludeIndirectDrugs;
      parameters.include_non_approved_drugs = this.harmonicIncludeNonApprovedDrugs;
      parameters.ignore_non_seed_baits = !this.harmonicIncludeCancerNonSeeds;
      if (this.harmonicMaxDeg && this.harmonicMaxDeg > 0) {
        parameters.max_deg = this.harmonicMaxDeg;
      }
      parameters.hub_penalty = this.harmonicHubPenalty;
      parameters.result_size = this.harmonicResultSize;
    } else if (this.algorithm === 'degree') {
      parameters.include_non_approved_drugs = this.degreeIncludeNonApprovedDrugs;
      parameters.ignore_non_seed_baits = !this.degreeIncludeCancerNonSeeds;
      if (this.degreeMaxDeg && this.degreeMaxDeg > 0) {
        parameters.max_deg = this.degreeMaxDeg;
      }
      parameters.result_size = this.degreeResultSize;
    } else if (this.algorithm === 'proximity') {
      parameters.include_non_approved_drugs = this.proximityIncludeNonApprovedDrugs;
      if (this.proximityMaxDeg && this.proximityMaxDeg > 0) {
        parameters.max_deg = this.proximityMaxDeg;
      }
      parameters.hub_penalty = this.proximityHubPenalty;
      parameters.result_size = this.proximityResultSize;
    } else if (this.algorithm === 'betweenness') {
      parameters.ignore_non_seed_baits = !this.betweennessIncludeCancerNonSeeds;
      if (this.betweennessMaxDeg && this.betweennessMaxDeg > 0) {
        parameters.max_deg = this.betweennessMaxDeg;
      }
      parameters.hub_penalty = this.betweennessHubPenalty;
      parameters.result_size = this.betweennessResultSize;
    } else if (this.algorithm === 'keypathwayminer') {
      parameters.k = this.keypathwayminerK;
    } else if (this.algorithm === 'domino') {
      if (this.dominoMaxDeg && this.dominoMaxDeg > 0) {
        parameters.max_deg = this.dominoMaxDeg;
      }
    } else if (this.algorithm === 'multisteiner') {
      parameters.num_trees = this.multisteinerNumTrees;
      parameters.tolerance = this.multisteinerTolerance;
      parameters.ignore_non_seed_baits = !this.multisteinerIncludeCancerNonSeeds;
      if (this.multisteinerMaxDeg && this.multisteinerMaxDeg > 0) {
        parameters.max_deg = this.multisteinerMaxDeg;
      }
      parameters.hub_penalty = this.multisteinerHubPenalty;
    }
    await this.analysis.startAnalysis(this.algorithm, this.target, parameters);
  }

}
