import { Injectable } from '@angular/core';

import {environment} from '../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {CancerType, DataLevel, Dataset, CancerNode, Node} from './interfaces';

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
     * Returns promise of a list of all datasets
     * data = [
     *     {
     *         "id": 1,
     *         "name": "NCG6"
     *     },
     *     {
     *         "id": 2,
     *         "name": "COSMIC"
     *     }
     * ]
     *
     */

    return this.http.get<any>(`${environment.backend}cancer_datasets/`).toPromise();
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
     * Returns a list of all related cancer types for single node with cancer types ids
     */

    const params = new HttpParams()
      .set('dataset', JSON.stringify(dataset.backendId))
      .set('backendId', JSON.stringify(node.backendId))
    ;

    return this.http.get<any>(`${environment.backend}related_cancer_types/`, {params}).toPromise();

  }

  public async getNetwork(dataset: Dataset, dataLevel: DataLevel, cancerTypes: CancerType[]): Promise<any> {
    /**
     * returns promise of all data needed to construct a gene gene interaction network
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
        .set('dataLevel', JSON.stringify(dataLevel))
      ;

    return this.http.get<any>(`${environment.backend}network/`, {params}).toPromise();
  }

  public async getNodeInteractions(
    dataset: Dataset,
    dataLevel: DataLevel,
    cancerTypes: CancerType[],
    node: CancerNode
  ): Promise<any> {
    /**
     * returns promise of all data needed to construct a gene gene interaction network
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
      .set('dataLevel', JSON.stringify(dataLevel))
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

  public async getTaskResultCancerDriverGene(token): Promise<any> {
    /**
     * returns promise of cancer driver gene view of task result of COMPLETED task
     */
    return this.http.get<any>(`${environment.backend}task_result/?token=${token}&view=cancer_driver_genes`).toPromise();
  }

  public async postTask(algorithm: 'super' | 'quick', target, parameters, ) {
    /**
     * sends a task to task service
     */

    return this.http.post<any>(`${environment.backend}task/`, {
      algorithm,
      target,
      parameters,
    }).toPromise();
  }


}
