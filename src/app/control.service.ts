import { Injectable } from '@angular/core';

import {environment} from '../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {CancerType, Dataset} from "./interfaces";

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
     // data = [
     //     {
    //         "id": 1,
    //         "name": "NCG6"
    //     },
     //     {
    //         "id": 2,
    //         "name": "COSMIC"
    //     }
     // ]
     **/
    return this.http.get<any>(`${environment.backend}cancer_datasets/`).toPromise();
  }

  public async getCancerTypes(): Promise<any> {
    /**
     * Returns promise of a list of all cancer types
     *
     *
     // [
     //     {
    //         "id": 1,
    //         "name": "pan-cancer_adult"
    //     },
     //     {
    //         "id": 2,
    //         "name": "-"
    //     },
     //     {
    //         "id": 3,
    //         "name": "pan-cancer_paediatric"
    //     },
     //    ... ]
     **/
    return this.http.get<any>(`${environment.backend}cancer_types/`).toPromise();
  }

  public async getNetwork(dataset: Dataset, cancerTypes: CancerType[]): Promise<any> {
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
    const cancerTypesIds = cancerTypes.map( (cancerType) => cancerType.id);
    const cancerTypesIdsString = cancerTypesIds.join(',')
    const params = new HttpParams()
        .set('dataset', JSON.stringify(dataset.id))
        .set('cancerTypes', JSON.stringify(cancerTypesIdsString))
      ;

    return this.http.get<any>(`${environment.backend}network/`, {params}).toPromise();
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

}
