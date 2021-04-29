import { Injectable } from '@angular/core';

import {environment} from '../../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {
  CancerType,
  MutationCancerType,
  Tissue,
  Dataset,
  CancerNode,
  Node,
  ExpressionCancerType,
  Disease,
  DrugStatus
} from '../../interfaces';
import {AlgorithmType, QuickAlgorithmType} from '../analysis/analysis.service';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})


export class ControlService {
  /**
   * The control service manages all connections to the backend
   */

  constructor(private http: HttpClient) { }

  public async getCancerDatasets(): Promise<any> {
    /**
     * Returns promise of a list of all cancer datasets
     * data = [
     *     {
     *         "id": 1,
     *         "name": "NCG6",
     *         "count": xxx,
     *         "link": sssdsd
     *     },
     *     {
     *         "id": 2,
     *         "name": "COSMIC",
     *         "count": xxx,
     *         "link": sssdsd
     *     }
     * ]
     *
     */

    return this.http.get<any>(`${environment.backend}cancer_datasets/`).toPromise();
  }

  public async getDiseases(): Promise<any> {
    /**
     * Returns promise of a list of all diseases
     * response.diseases = [
     *     {
     *         "backendId": 1,
     *         "name": "xxxx",
     *     },
     *     {
     *         "backendId": 2,
     *         "name": "yyyy",
     *     }
     * ]
     *
     */

    return this.http.get<any>(`${environment.backend}diseases/`).toPromise();
  }

  public async getInteractionGeneDatasets(): Promise<any> {
    /**
     * Returns promise of a list of all gene interaction datasets
     * data = [
     *     {
     *         "id": 1,
     *         "name": "BioGRID",
     *         "count": xxx,
     *         "link": sssdsd
     *     },
     *     {
     *         "id": 2,
     *         "name": "CoVex",
     *         "count": xxx,
     *         "link": sssdsd
     *     }
     * ]
     *
     */

    return this.http.get<any>(`${environment.backend}interaction_gene_datasets/`).toPromise();
  }

  public async getInteractionDrugDatasets(): Promise<any> {
    /**
     * Returns promise of a list of all drug interaction datasets
     * data = [
     *     {
     *         "id": 1,
     *         "name": "BioGRID",
     *         "count": xxx,
     *         "link": sssdsd
     *     },
     *     {
     *         "id": 2,
     *         "name": "CoVex",
     *         "count": xxx,
     *         "link": sssdsd
     *     }
     * ]
     *
     */

    return this.http.get<any>(`${environment.backend}interaction_drug_datasets/`).toPromise();
  }

  public async getCancerTypes(dataset: Dataset): Promise<any> {
    /**
     * Returns promise of a list of all cancer types
     *
     *
     * [
     *     {
     *         "id": 1,
     *         "name": "pan-cancer_adult"
     *     },
     *     {
     *         "id": 2,
     *         "name": "-"
     *     },
     *     {
     *         "id": 3,
     *         "name": "pan-cancer_paediatric"
     *     },
     *    ... ]
     */

    const params = new HttpParams().set('dataset', JSON.stringify(dataset.backendId));

    return this.http.get<any>(`${environment.backend}cancer_types/`, {params}).toPromise();
  }

  public async getRelatedCancerTypes(dataset: Dataset, node: CancerNode | Node): Promise<any> {
    /**
     * Returns a list of all comorbidities for given node (gene or protein)
     */

    const params = new HttpParams()
      .set('dataset', JSON.stringify(dataset.backendId))
      .set('node_backendId', JSON.stringify(node.backendId))
    ;

    return this.http.get<any>(`${environment.backend}related_cancer_types/`, {params}).toPromise();
  }

  public async getComorbidities(node: CancerNode | Node): Promise<any> {
    /**
     * Returns a list of all related cancer types for single node with cancer types ids
     */

    const params = new HttpParams()
      .set('node_backendId', JSON.stringify(node.backendId))
    ;

    return this.http.get<any>(`${environment.backend}comorbidities_node/`, {params}).toPromise();
  }

  public async getComorbiditiesForCancerType(cancerDataset: Dataset, cancerTypes: CancerType[]): Promise<any> {
    /**
     * Returns a dict of all related comorbidities with counts representing how many genes link to comorbidity
     *
     * counts: {
     *
     * "46 XX gonadal dysgenesis": 3
     *
     * "Acquired hemolytic anemia": 2
     *
     * "Acute nephritic syndrome": 1
     *
     * "Acute pancreatitis": 3
     * }
     */

    const cancerTypesIds = cancerTypes.map( (cancerType) => cancerType.backendId);
    const cancerTypesIdsString = cancerTypesIds.join(',');
    const params = new HttpParams()
      .set('cancerDatasetBackendId', JSON.stringify(cancerDataset.backendId))
      .set('cancerTypeBackendIds', JSON.stringify(cancerTypesIdsString))
    ;

    return this.http.get<any>(`${environment.backend}comorbidities_cancer_type/`, {params}).toPromise();
  }

  public async getNetwork(dataset: Dataset, interactionDataset: Dataset, cancerTypes: CancerType[]): Promise<any> {
    /**
     * returns promise of all data needed to construct a gene gene interaction network
     * used for explore network
     *
     * { 'genes': [
     *   ...
     *    ],
     *    'interactions': [
     *      ...
     *    ]
     *    }
     */
    const cancerTypesIds = cancerTypes.map( (cancerType) => cancerType.backendId);
    const cancerTypesIdsString = cancerTypesIds.join(',');
    const params = new HttpParams()
        .set('dataset', JSON.stringify(dataset.backendId))
        .set('cancerTypes', JSON.stringify(cancerTypesIdsString))
        .set('interactionDataset', JSON.stringify(interactionDataset.backendId))
      ;

    return this.http.get<any>(`${environment.backend}network/`, {params}).toPromise();
  }

  public async getNodeInteractions(
    dataset: Dataset,
    interactionDataset: Dataset,
    cancerTypes: CancerType[],
    node: CancerNode | Node
  ): Promise<any> {
    /**
     * returns promise of all data needed to construct a gene gene interaction network
     * used to add single cancer nodes to explore network
     *
     * {
     *    'interactions': [
     *      ...
     *    ]
     * }
     */
    const cancerTypesIds = cancerTypes.map( (cancerType) => cancerType.backendId);
    const cancerTypesIdsString = cancerTypesIds.join(',');
    const params = new HttpParams()
      .set('dataset', JSON.stringify(dataset.backendId))
      .set('cancerTypes', JSON.stringify(cancerTypesIdsString))
      .set('interactionDataset', JSON.stringify(interactionDataset.backendId))
      .set('backendId', JSON.stringify(node.backendId))
    ;

    return this.http.get<any>(`${environment.backend}nodeRelations/`, {params}).toPromise();
  }

  public async getSummary(): Promise<any> {
    /**
     * returns summary information of the database
     */
    return this.http.get(`${environment.backend}summary/`).toPromise();
  }

  public async getTask(token): Promise<any> {
    /**
     * returns promise of task status
     */
    return this.http.get(`${environment.backend}task/?token=${token}`).toPromise();
  }

  public async getTasks(tokens): Promise<any> {
    /**
     * returns promise of tasks status
     */
    return this.http.post<any>(`${environment.backend}tasks/`, {tokens: JSON.stringify(tokens)}).toPromise();
  }

  public async getTaskResult(token): Promise<any> {
    /**
     * returns promise of task result of COMPLETED task
     */
    return this.http.get<any>(`${environment.backend}task_result/?token=${token}`).toPromise();
  }

  public async getTaskResultDrug(token): Promise<any> {
    /**
     * returns promise of drug view of task result of COMPLETED task
     */
    return this.http.get<any>(`${environment.backend}task_result/?token=${token}&view=drugs`).toPromise();
  }

  public async getTaskResultGene(token): Promise<any> {
      /**
       * returns promise of gene view of task result of COMPLETED task
       */
    return this.http.get<any>(`${environment.backend}task_result/?token=${token}&view=genes`).toPromise();
  }

  public async getTaskResultCancerNode(token): Promise<any> {
    /**
     * returns promise of cancer driver gene view of task result of COMPLETED task
     */
    return this.http.get<any>(`${environment.backend}task_result/?token=${token}&view=cancer_driver_genes`).toPromise();
  }

  public async postTask(algorithm: QuickAlgorithmType | AlgorithmType, target, parameters, ) {
    /**
     * sends a task to task service
     */

    return this.http.post<any>(`${environment.backend}task/`, {
      algorithm,
      target,
      parameters,
    }).toPromise();
  }

  public async getDrugInteractions(token, drugStatus: DrugStatus): Promise<any> {
    /**
     * returns drugs that have interactions with analysis result nodes
     *
     * SPECIAL CASE: drug status backend ID can be -1, which means 'all'
     * this is being dealt with in the backend
     */

    const params = new HttpParams()
      .set('token', JSON.stringify(token))
      .set('drugStatus', JSON.stringify(drugStatus.backendId))
    ;

    return this.http.get<any>(`${environment.backend}drug_interactions/`, {params}).toPromise();
  }

  public async queryGenes(nodes, cancerDataset: Dataset, cancerTypes: CancerType[]): Promise<any> {
    /**
     * returns genes for genes in list if gene is in db
     */
    const cancerTypesIds = cancerTypes.map( (cancerType) => cancerType.backendId);
    const cancerTypesIdsString = cancerTypesIds.join(',');

    return this.http.post<any>(`${environment.backend}query_nodes/`, {
      nodes: JSON.stringify(nodes),
      cancerDataset: JSON.stringify(cancerDataset.backendId),
      cancerTypes:  JSON.stringify(cancerTypesIdsString)
    }).toPromise();
  }

  public expressionCancerTypeExpressionGenes(
    expressionCancerType: ExpressionCancerType, genes: Node[], cancerGenes: CancerNode[]
    ): Observable<any> {
    /**
     * Returns the expression in the given expressionCancerType for given nodes and cancerNodes
     */
    const genesBackendIds = genes.map( (gene) => gene.backendId).join(',');
    const cancerGenesBackendIds = cancerGenes.map( (gene) => gene.backendId).join(',');
    const params = new HttpParams()
      .set('cancerType', `${expressionCancerType.backendId}`)
      .set('genes', JSON.stringify(genesBackendIds))
      .set('cancerGenes', JSON.stringify(cancerGenesBackendIds));
    return this.http.get(`${environment.backend}gene_expression/`, {params});
  }

  public mutationScores(
    mutationCancerType: MutationCancerType,
    genes: Node[],
    cancerGenes: CancerNode[]
  ): Promise<any> {
    /**
     * Returns the mutation data in the given cancer type for given nodes and cancerNodes
     */
    const genesBackendIds = genes.map( (gene) => gene.backendId).join(',');
    const cancerGenesBackendIds = cancerGenes.map( (gene) => gene.backendId).join(',');
    return this.http.post<any>(`${environment.backend}mutation_scores/`,
      {
        mutationCancerType: `${mutationCancerType.backendId}`,
        genes: JSON.stringify(genesBackendIds),
        cancerGenes: JSON.stringify(cancerGenesBackendIds)
      }
      ).toPromise();
    }

  public tissues(): Observable<any> {
    /**
     * Lists all available tissues with id and name
     */
    return this.http.get<Tissue[]>(`${environment.backend}tissues/`);
  }

  public tissueExpressionGenes(tissue: Tissue, genes: Node[], cancerGenes: CancerNode[]): Observable<any> {
    /**
     * Returns the expression in the given tissue for given nodes and cancerNodes
     */
    const genesBackendIds = genes.map( (gene) => gene.backendId).join(',');
    const cancerGenesBackendIds = cancerGenes.map( (gene) => gene.backendId).join(',');
    const params = new HttpParams()
      .set('tissue', `${tissue.backendId}`)
      .set('genes', JSON.stringify(genesBackendIds))
      .set('cancerGenes', JSON.stringify(cancerGenesBackendIds));
    return this.http.get(`${environment.backend}tissue_expression/`, {params});
  }

  public expressionCancerTypeExpression(
    expressionCancerType: ExpressionCancerType, dataset: Dataset, cancerTypes: CancerType[]
    ): Observable<any> {
    /**
     * Fetches genes with expression levels for input data
     * returns list of objects with key "gene" and gene-information as well as
     * key "level" with expression level number or null
     */
    const cancerTypesIds = cancerTypes.map( (cancerType) => cancerType.backendId);
    const cancerTypesIdsString = cancerTypesIds.join(',');
    const params = new HttpParams()
      .set('expressionCancerType', `${expressionCancerType.backendId}`)
      .set('data', JSON.stringify(dataset.backendId))
      .set('cancerTypes', JSON.stringify(cancerTypesIdsString));

    return this.http.get(`${environment.backend}gene_expression/`, {params});
  }

  public expressionCancerTypes(): Observable<any> {
    /**
     * Lists all available expressionCancerTypes with id and name
     */
    return this.http.get<ExpressionCancerType[]>(`${environment.backend}expression_cancer_types/`);
  }

  public mutationCancerTypes(): Observable<any> {
    /**
     * Lists all available expressionCancerTypes with id and name
     */
    return this.http.get<MutationCancerType[]>(`${environment.backend}mutation_cancer_types/`);
  }

  public getDrugStatus(): Observable<any> {
    /**
     * Lists all available drug status with id and name
     */
    return this.http.get<DrugStatus[]>(`${environment.backend}drug_status/`);
  }

  public query_expressionCancerType_genes(expressionCancerType: ExpressionCancerType, threshold: number): Promise<any> {
    /**
     * Lists all available expressionCancerTypes with id and name
     */

    return this.http.post<any>(`${environment.backend}query_expressionCancerType_genes/`,
      {
        expressionCancerTypeId: JSON.stringify(expressionCancerType.backendId),
        threshold: JSON.stringify(threshold)
      }).toPromise();
  }

  public queryDiseaseGenesByCancer(diseases: Disease[], dataset: Dataset, cancerTypes: CancerType[]): Promise<any> {
    /**
     * Returns all genes and cancer genes related to input diseases and cancer dataset / type
     * Returns found genes and cancerGenes
     */
    const diseaseIds = diseases.map( (disease) => disease.backendId);
    const cancerTypesIds = cancerTypes.map( (cancerType) => cancerType.backendId);

    const params = new HttpParams()
      .set('diseases', JSON.stringify(diseaseIds))
      .set('data', JSON.stringify(dataset.backendId))
      .set('cancer_types', JSON.stringify(cancerTypesIds));

    return this.http.get(`${environment.backend}query_disease_genes/`, {params}).toPromise();
  }

  public queryDiseaseGenesByGenes(diseases: Disease[], genes: Node[], cancerGenes: CancerNode[]): Promise<any> {
    /**
     * Lookup for input genes and cancer genes if they occur in the given diseases
     * Returns Mapping where True indicates, that gene occurs in Diseases
     */
    const diseaseIds = diseases.map( (disease) => disease.backendId);
    const geneIds = genes.map( (gene) => gene.backendId);
    const cancerGeneIds = cancerGenes.map( (cancerGene) => cancerGene.backendId);

    const params = new HttpParams()
      .set('diseases', JSON.stringify(diseaseIds))
      .set('genes', JSON.stringify(geneIds))
      .set('cancer_genes', JSON.stringify(cancerGeneIds));

    return this.http.get(`${environment.backend}query_disease_genes/`, {params}).toPromise();
  }

  public drugLookup(searchString: string, dataset: Dataset): Promise<any> {
    /**
     * Returns all genes and cancer genes related to input diseases and cancer dataset / type
     * Returns found genes and cancerGenes
     */

    const params = new HttpParams()
      .set('text', JSON.stringify(searchString))
      .set('dataset', JSON.stringify(dataset.backendId));
    return this.http.get(`${environment.backend}drug_interaction_lookup/`, {params}).toPromise();
  }

  public vcfLookup(fileContent: string, threshold: number): Promise<any> {
    return this.http.post<any>(`${environment.backend}vcf_lookup/`,
      {
        fileData: JSON.stringify(fileContent),
        threshold:  JSON.stringify(threshold),
      }).toPromise();
  }

}
