import {AlgorithmType, QuickAlgorithmType} from './analysis.service';

export interface Gene {
  /**
   * Interface for gene
   */
  name: string;
  backendId: string;
  interactions?: CancerDriverGene[];
  x?: number;
  y?: number;
  expressionLevel?: number;
}

export type DataLevel = 'gene' | 'protein'

export interface Tissue {
  /**
   * Interface for tissue
   */
  id: number;
  name: string;
}

export interface CancerDriverGene {
  /**
   * Interface for cancer driver gene
   */
  geneName: string;
  backendId: string;
  entityid: string;
  cancerType: string;
  datasetName: string;
  interactions?: Gene[];
  x?: number;
  y?: number;
}

export interface GeneDriverInteraction {
  /**
   * Interface for gene - cancer driver gene - interaction
   */
  geneName: string;
  cancerDriverGeneName: string;
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

export function getGeneNodeId(gene: Gene) {
  /**
   * Returns the network node id based on a given gene
   */
  return `g_${gene.backendId}`;
}

export function getGeneBackendId(gene: Gene) {
  /**
   * Returns backend_id of Gene object
   */
  return gene.backendId;
}

export function getCancerDriverGeneNodeId(cancer_driver_gene: CancerDriverGene) {
  /**
   * Returns node ID for CancerDriverGene object
   */
  return `cdg_${cancer_driver_gene.geneName}`;
}

export function getNodeIdsFromGeneDriverGeneInteraction(geneDriverInteraction: GeneDriverInteraction) {
  /**
   * Returns js object with network node endpoints of given GeneDriverInteraction object
   */
  return {
    from: `g_${geneDriverInteraction.id}`,
    to: `cdg_${geneDriverInteraction.geneName}_${geneDriverInteraction.cancerDriverGeneName}`,
  };
}

export function getNodeIdsFromGeneGeneInteraction(edge: NetworkEdge, wrappers: { [key: string]: Wrapper }) {
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
    from: `cdg_${edge.from}`,
    to: `d_${edge.to}`,
  };
}

export function getCancerDriverGeneBackendId(cancerDriverGene: CancerDriverGene) {
  /**
   * Returns backend_id given a CancerDriverGene object
   */
  return cancerDriverGene.backendId;
}

export function getDrugNodeId(drug: Drug) {
  /**
   * Returns network drug-node id given a Drug object
   */
  return `d_${drug.backendId}`;
}

export function getDrugBackendId(drug: Drug) {
  /**
   * Returns backend_id given a Drug object
   */
  return drug.backendId;
}

export function getWrapperFromGene(gene: Gene): Wrapper {
  /**
   * Constructs wrapper interface for gene
   */
  return {
    backendId: getGeneBackendId(gene),
    nodeId: getGeneNodeId(gene),
    type: 'gene',
    data: gene,
  };
}

export function getWrapperFromCancerDriverGene(cancer_gene: CancerDriverGene): Wrapper {
  return {
    backendId: getCancerDriverGeneBackendId(cancer_gene),
    nodeId: getCancerDriverGeneNodeId(cancer_gene),
    type: 'cancerDriverGene',
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

export type WrapperType = 'gene' | 'cancerDriverGene' | 'drug';

export interface Wrapper {
  /**
   * Wrapper is common interface for all genes and drugs
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
  data?: CancerDriverGene[];
}

export interface CancerType {
  name: string;
  backendId: number;
}
