import {AlgorithmType, QuickAlgorithmType} from './analysis.service';

export interface Node {
  /**
   * Interface for gene/protein
   */
  name: string;
  backendId: string;
  interactions?: (CancerNode | Node)[];
  x?: number;
  y?: number;
  expressionLevel?: number;
  proteinName?: string;
}

export type DataLevel = 'gene' | 'protein'

export interface Tissue {
  /**
   * Interface for tissue
   */
  id: number;
  name: string;
}

export interface CancerNode {
  /**
   * Interface for cancer driver gene or protein
   */
  name: string;
  backendId: string;
  type: string;
  datasetName: string;
  interactions?: (Node | CancerNode)[];
  x?: number;
  y?: number;
  // if gene
  entityid?: string;
  // if protein
  pubmedId?: string;

}

export interface Interaction {
  /**
   * Interface for gene-gene-interaction or protein-protein-interaction
   */
  interactorAName: string;
  interactorBName: string;
  interactorABackendId: string;
  interactorBBackendId: string;
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
}

export interface Seeded {
  isSeed: boolean;
}

export interface Baited {
  closestViralProteins: string[];
  closestDistance: number;
}

export function getGeneNodeId(gene: Node) {
  /**
   * Returns the network node id based on a given gene
   */
  return `${gene.backendId}`;
}

export function getGeneBackendId(gene: Node) {
  /**
   * Returns backend_id of Gene object
   */
  return gene.backendId.toString();
}

export function getCancerDriverGeneNodeId(cancer_driver_gene: CancerNode) {
  /**
   * Returns node ID for CancerDriverGene object
   */
  return `${cancer_driver_gene.backendId}`;
}

export function getNodeIdsFromGeneGeneInteraction(geneGeneInteraction: Interaction) {
  /**
   * Returns js object with network node endpoints of given GeneGeneInteraction object
   */
  return {
    from: `${geneGeneInteraction.interactorABackendId}`,
    to: `${geneGeneInteraction.interactorBBackendId}`,
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
  return `${drug.backendId}`;
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
    type: 'node',
    data: gene,
  };
}

export function getWrapperFromCancerNode(cancer_gene: CancerNode): Wrapper {
  return {
    backendId: getCancerDriverGeneBackendId(cancer_gene),
    nodeId: getCancerDriverGeneNodeId(cancer_gene),
    type: 'cancerNode',
    data: cancer_gene,
  };
}

export function getWrapperFromDrug(drug: Drug): Wrapper {
  return {
    backendId: getDrugBackendId(drug),
    nodeId: getDrugNodeId(drug),
    type: 'drug',
    data: drug,
  };
}

export type WrapperType = 'node' | 'cancerNode' | 'drug';

export interface Wrapper {
  /**
   * Wrapper is common interface for all nodes (genes and proteins), cancer nodes and drugs
   * provides backend information
   */
  backendId: string;
  nodeId: string;
  type: WrapperType;
  data: any;
}

export interface Drug {
  backendId: string;
  name: string;
  status: 'approved' | 'investigational';
  inTrial: boolean;
  inLiterature: boolean;
  trialLinks: string[];
}

export interface Dataset {
  name: string;
  link: string;
  backendId: number;
  data?: CancerNode[];
}

export interface CancerType {
  name: string;
  backendId: number;
}
