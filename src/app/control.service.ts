import { Injectable } from '@angular/core';

import {environment} from '../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {CancerType, Dataset, CancerNode, Node} from './interfaces';
import {AlgorithmType, QuickAlgorithmType} from './analysis.service';

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
    node: CancerNode
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
    return this.http.get<any>(`${environment.backend}tasks/?tokens=${JSON.stringify(tokens)}`).toPromise();
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

  public async getDrugInteractions(token): Promise<any> {
    /**
     * returns drugs that have interactions with analysis result nodes
     */
    return this.http.get<any>(`${environment.backend}drug_interactions/?token=${token}&view=cancer_driver_genes`).toPromise();
  }

  public async queryGenes(genes): Promise<any> {
    /**
     * returns genes for genes in list if gene is in db
     */
    return this.http.post<any>(`${environment.backend}query_nodes/`, genes).toPromise();
  }


}
