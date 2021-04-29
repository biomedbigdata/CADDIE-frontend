import {AlgorithmType, QuickAlgorithmType} from './services/analysis/analysis.service';

export interface Node {
  /**
   * Interface for gene/protein
   */
  name: string;
  backendId: string;
  graphId: string;
  interactions?: (CancerNode | Node)[];
  x?: number;
  y?: number;
  expressionLevel?: number;
  uniprotAc?: string;
  proteinName?: string;
  cancerOccurrences: number;
  mutationCounts: number;
  mutationScore: number;
}

export interface ExpressionCancerType {
  /**
   * Interface for expressionCancerType
   */
  backendId: number;
  name: string;
}

export interface Tissue {
  /**
   * Interface for tissue
   */
  backendId: number;
  name: string;
}

export interface MutationCancerType {
  /**
   * Interface for MutationCancerType
   */
  backendId: number;
  name: string;
  abbreviation: string;
}

export interface DrugStatus {
  backendId: number;
  name: string;
}

export interface Disease {
  name: string;
  backendId: string;
  mondoId: string;
  icd10: string;
}

export interface DiseaseGeneInteraction {
  diseaseName: string;
  diseaseBackendId: string;
  diseaseMondoId: string;
  diseaseIcd10: string;
  geneBackendId: string;
  geneName: string;
  geneEntrezId: string;
}

export interface CancerNode {
  /**
   * Interface for cancer driver gene or protein
   */
  name: string;
  backendId: string;
  graphId: string;
  type: string;
  datasetName: string;
  interactions?: (Node | CancerNode)[];
  x?: number;
  y?: number;
  // if gene
  entityid?: string;
  // if protein
  pubmedId?: string;
  cancer_occurrences: number;
  uniprotAc?: string;
  proteinName?: string;
  expressionLevel?: number;
  mutationCounts: number;
  mutationScore: number;
}

export interface Interaction {
  /**
   * Interface for gene-gene-interaction or protein-protein-interaction
   */
  interactorAName: string;
  interactorBName: string;
  interactorABackendId: string;
  interactorBBackendId: string;
  interactorAGraphId: string;
  interactorBGraphId: string;
  datasetName: string;
  id: string;
}

export interface NetworkEdge {
  /**
   * Interface for edge object of network
   */
  from: string;
  to: string;
}

export interface Task {
  /**
   * Interface for task
   */
  token: string;
  info: {
    target: 'drug' | 'drug-target',
    algorithm: AlgorithmType | QuickAlgorithmType;
    parameters?: { [key: string]: any };

    workerId?: string;
    jobId?: string;

    progress: number;
    status: string;

    createdAt: string;
    startedAt: string;
    finishedAt: string;

    done: boolean;
    failed: boolean;
  };
  stats: {
    queuePosition: number;
    queueLength: number;
  };
}

export interface Scored {
  score: number;  // Normalized or unnormalized (whichever user selects, will be displayed in the table)
  rawScore: number;  // Unnormalized (kept to restore unnormalized value)

  mutationScore: number;  // Normalized or unnormalized (whichever user selects, will be displayed in the table)
  rawMutationScore: number;  // Unnormalized (kept to restore unnormalized value)
}

export interface Seeded {
  isSeed: boolean;
}

export interface Baited {
  closestCancerGenes: string[];
  closestDistance: number;
}

export function getGeneNodeId(gene: Node) {
  /**
   * Returns the network node id based on a given gene
   */
  return `${gene.graphId}`;
}

export function getGeneBackendId(gene: Node) {
  /**
   * Returns backend_id of Gene object
   */
  return gene.backendId.toString();
}

export function getCancerDriverGeneNodeId(cancerDriverGene: CancerNode) {
  /**
   * Returns node ID for CancerDriverGene object
   */
  return `${cancerDriverGene.graphId}`;
}

export function getNodeIdsFromGeneGeneInteraction(geneGeneInteraction: Interaction) {
  /**
   * Returns js object with network node endpoints of given GeneGeneInteraction object
   */
  return {
    from: `${geneGeneInteraction.interactorAGraphId}`,
    to: `${geneGeneInteraction.interactorBGraphId}`,
  };
}

export function getNodeIdsFromEdgeGene(edge: NetworkEdge, wrappers: { [key: string]: Wrapper }) {
  /**
   * Returns endpoints of network edge (Gene Gene interaction)
   */
  return {
    from: wrappers[edge.from].nodeId,
    to: wrappers[edge.to].nodeId,
  };
}

export function getNodeIdsFromCancerDriverGeneDrugInteraction(edge: NetworkEdge) {
  /**
   * Returns endpoints of newtork edge (CancerDriverGene Drug interaction)
   */
  return {
    from: `${edge.from}`,
    to: `${edge.to}`,
  };
}

export function getCancerDriverGeneBackendId(cancerDriverGene: CancerNode) {
  /**
   * Returns backend_id given a CancerDriverGene object
   */
  return cancerDriverGene.backendId.toString();
}

export function getDrugNodeId(drug: Drug) {
  /**
   * Returns network drug-node id given a Drug object
   */
  return `${drug.graphId}`;
}

export function getDrugBackendId(drug: Drug) {
  /**
   * Returns backend_id given a Drug object
   */
  return drug.backendId.toString();
}

export function getWrapperFromNode(gene: Node): Wrapper {
  /**
   * Constructs wrapper interface for gene
   */
  return {
    backendId: getGeneBackendId(gene),
    nodeId: getGeneNodeId(gene),
    type: 'Node',
    data: gene,
  };
}

export function getWrapperFromCancerNode(cancerGene: CancerNode): Wrapper {
  return {
    backendId: getCancerDriverGeneBackendId(cancerGene),
    nodeId: getCancerDriverGeneNodeId(cancerGene),
    type: 'CancerNode',
    data: cancerGene,
  };
}

export function getWrapperFromDrug(drug: Drug): Wrapper {
  return {
    backendId: getDrugBackendId(drug),
    nodeId: getDrugNodeId(drug),
    type: 'Drug',
    data: drug,
  };
}

export type WrapperType = 'Node' | 'CancerNode' | 'Drug';

export interface Wrapper {
  /**
   * Wrapper is common interface for all nodes (genes and proteins), cancer nodes and drugs
   * provides backend information
   */
  backendId: string;
  nodeId: string;
  type: WrapperType;
  data: any;
  nodeDegree?: number;
  cancerTypes?: CancerType[];
  comorbidities?: string[];
}

export interface Drug {
  backendId: string;
  graphId: string;
  name: string;
  dbId: string;
  status: 'approved' | 'unapproved';
  isAtcAntineoplasticAndImmunomodulatingAgent: boolean;
  inLiterature: boolean;
  trialLinks: string[];
}

export interface Dataset {
  name: string;
  link: string;
  backendId: number;
  version?: string;
  count?: number;
  data?: CancerNode[];
}

export interface Disease {
  backendId: string;
  name: string;
  mondoId: string;
  icd10: string;
}

export interface CancerType {
  name: string;
  backendId: number;
}

export interface BackendObject {
  name: string;
  backendId: number;
}
