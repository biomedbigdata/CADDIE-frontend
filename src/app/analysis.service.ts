import {
  Wrapper,
  Task,
  getWrapperFromNode,
  getWrapperFromCancerNode,
  Node,
  CancerNode,
  Dataset,
  Tissue,
  CancerType,
} from './interfaces';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environments/environment';
import {toast} from 'bulma-toast';
import {Injectable} from '@angular/core';
import {ControlService} from './control.service';

export type AlgorithmType = 'trustrank' | 'keypathwayminer' | 'multisteiner' | 'closeness' | 'degree' | 'proximity' | 'betweenness';
export type QuickAlgorithmType = 'quick' | 'super';

export const algorithmNames = {
  trustrank: 'TrustRank',
  keypathwayminer: 'KeyPathwayMiner',
  multisteiner: 'Multi-Steiner',
  closeness: 'Closeness Centrality',
  degree: 'Degree Centrality',
  proximity: 'Network Proximity',
  betweenness: 'Betweenness Centrality',
  quick: 'Simple',
  super: 'Quick-Start',
};

export interface Algorithm {
  slug: AlgorithmType | QuickAlgorithmType;
  name: string;
}

export const TRUSTRANK: Algorithm = {slug: 'trustrank', name: algorithmNames.trustrank};
export const CLOSENESS_CENTRALITY: Algorithm = {slug: 'closeness', name: algorithmNames.closeness};
export const DEGREE_CENTRALITY: Algorithm = {slug: 'degree', name: algorithmNames.degree};
export const NETWORK_PROXIMITY: Algorithm = {slug: 'proximity', name: algorithmNames.proximity};
export const BETWEENNESS_CENTRALITY: Algorithm = {slug: 'betweenness', name: algorithmNames.betweenness};
export const KEYPATHWAYMINER: Algorithm = {slug: 'keypathwayminer', name: algorithmNames.keypathwayminer};
export const MULTISTEINER: Algorithm = {slug: 'multisteiner', name: algorithmNames.multisteiner};

export const MAX_TASKS = 3;

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {

  private selection = 'main';

  private selectedItems = new Map<string, Wrapper>();
  private selectListSubject = new Subject<{ items: Wrapper[], selected: boolean | null }>();

  private selections = new Map<string, Map<string, Wrapper>>();

  public tokens: string[] = [];
  public finishedTokens: string[] = [];
  public tasks: Task[] = [];

  private intervalId: any;
  private canLaunchNewTask = true;

  private launchingQuick = false;

  private tissues: Tissue[] = [];

  constructor(private http: HttpClient, private control: ControlService) {
    const tokens = localStorage.getItem('tokens');
    const finishedTokens = localStorage.getItem('finishedTokens');
    if (tokens) {
      this.tokens = JSON.parse(tokens);
    }
    if (finishedTokens) {
      this.finishedTokens = JSON.parse(finishedTokens);
    }
    this.startWatching();

    this.tissues = [{
        id: 1, name: 'test'
      }];

    /*
    this.http.get<Tissue[]>(`${environment.backend}tissues/`).subscribe((tissues) => {
      this.tissues = tissues;
    });
    */

  }

  removeTask(token) {
    /**
     * Remove Task token out of objects tokens or finished tokens
     * +
     * Remove task out of objects tasks
     * +
     * Adds token to local storage
     */
    this.tokens = this.tokens.filter((item) => item !== token);
    this.finishedTokens = this.finishedTokens.filter((item) => item !== token);
    this.tasks = this.tasks.filter((item) => item.token !== (token));
    localStorage.setItem('tokens', JSON.stringify(this.tokens));
  }

  removeAllTasks() {
    /**
     * Empties all tasks, tokens and finished tokens + local storage
     */
    this.tasks = [];
    this.finishedTokens = [];
    this.tokens = [];
    localStorage.removeItem('tokens');
  }

  async getTasks() {
    /**
     * get all tasks related to objects tokens list
     */
    return await this.control.getTasks(this.tokens).catch((e) => {
      clearInterval(this.intervalId);
    });
  }

  public getTissues(): Tissue[] {
    /**
     * return all tissues saved in this object
     */
    return this.tissues;
  }

  public switchSelection(id: string) {
    /**
     * Input: id is task token
     *
     * Switches selected task items
     */
    this.selections.set(this.selection, this.selectedItems);
    if (this.selections.has(id)) {
      this.selectedItems = this.selections.get(id);
    } else {
      this.selectedItems = new Map<string, Wrapper>();
    }
    this.selectListSubject.next({items: Array.from(this.selectedItems.values()), selected: null});
    this.selection = id;
  }

  public addItems(wrappers: Wrapper[]): number {
    /**
     * Adds items to analysis (Genes, Drugs, ... anything wrapper obejct)
     *
     * Returns amount of input items that were added (we dont add duplicates)
     */
    const addedWrappers: Wrapper[] = [];
    for (const wrapper of wrappers) {
      if (!this.inSelection(wrapper)) {
        addedWrappers.push(wrapper);
        this.selectedItems.set(wrapper.nodeId, wrapper);
      }
    }
    this.selectListSubject.next({items: addedWrappers, selected: true});
    return addedWrappers.length;
  }

  public removeItems(wrappers: Wrapper[]) {
    /**
     * Removes items from analysis
     */
    const removedWrappers: Wrapper[] = [];
    for (const wrapper of wrappers) {
      if (this.selectedItems.delete(wrapper.nodeId)) {
        removedWrappers.push(wrapper);
      }
    }
    this.selectListSubject.next({items: removedWrappers, selected: false});
  }

  public addSeeds(nodes) {
    /**
     * add nodes to seed nodes
     */
    const addedWrappers: Wrapper[] = [];
    nodes.forEach((node) => {
      const wrapper: Wrapper = node.wrapper;
      if (node.isSeed === true && !this.inSelection(wrapper)) {
        addedWrappers.push(wrapper);
        this.selectedItems.set(wrapper.nodeId, wrapper);
      }
    });
    this.selectListSubject.next({items: addedWrappers, selected: true});
  }

  public removeSeeds(nodes) {
    /**
     * remove nodes from seed nodes
     */
    const removedWrappers: Wrapper[] = [];
    nodes.forEach((node) => {
      const wrapper: Wrapper = node.wrapper;
      if (node.isSeed === true && this.inSelection(wrapper)) {
        removedWrappers.push(wrapper);
        this.selectedItems.delete(wrapper.nodeId);
      }
    });
    this.selectListSubject.next({items: removedWrappers, selected: false});
  }

  public invertSelection(nodes) {
    /**
     * Inverts selected nodes
     */
    const newSelection = [];
    nodes.forEach((node) => {
      const wrapper: Wrapper = node.wrapper;
      if (wrapper.type === 'Node' || wrapper.type === 'CancerNode') {
        if (!this.inSelection(wrapper)) {
          newSelection.push(wrapper);
        }
      }
    });
    this.selectedItems.clear();
    for (const wrapper of newSelection) {
      this.selectedItems.set(wrapper.nodeId, wrapper);
    }
    this.selectListSubject.next({items: newSelection, selected: null});
  }

  public addExpressedGenes(nodes, proteins: Node[], threshold: number): number {
    /**
     * Returns amount of genes which have higher expression than threshold
     * +
     * Sets these genes to 'this.selectedItems'
     */
    const items: Wrapper[] = [];
    const visibleIds = new Set<string>(nodes.getIds());
    for (const protein of proteins) {
      const wrapper = getWrapperFromNode(protein);
      const found = visibleIds.has(wrapper.nodeId);
      if (found && !this.inSelection(wrapper) && protein.expressionLevel > threshold) {
        items.push(wrapper);
        this.selectedItems.set(wrapper.nodeId, wrapper);
      }
    }
    this.selectListSubject.next({items, selected: true});
    return items.length;
  }

  public addVisibleGenes(nodes, genes: Node[]): number {
    /**
     * adds all genes currently displayed in network to selection
     */
    const items: Wrapper[] = [];
    const visibleIds = new Set<string>(nodes.getIds());
    for (const gene of genes) {
      const wrapper = getWrapperFromNode(gene);
      const found = visibleIds.has(wrapper.nodeId);
      if (found && !this.inSelection(wrapper)) {
        items.push(wrapper);
        this.selectedItems.set(wrapper.nodeId, wrapper);
      }
    }
    this.selectListSubject.next({items, selected: true});
    return items.length;
  }

  public addVisibleCancerDriverGenes(nodes, cancerDriverGenes: CancerNode[]): number {
    /**
     * adds all visible cancer driver genes from network to selection
     */
    const items: Wrapper[] = [];
    const visibleIds = new Set<string>(nodes.getIds());
    for (const cancerDriverGene of cancerDriverGenes) {
      const wrapper = getWrapperFromCancerNode(cancerDriverGene);
      const found = visibleIds.has(wrapper.nodeId);
      if (found && !this.inSelection(wrapper)) {
        items.push(wrapper);
        this.selectedItems.set(wrapper.nodeId, wrapper);
      }
    }
    this.selectListSubject.next({items, selected: true});
    return items.length;
  }

  public removeAllNodes() {
    /**
     * removes all genes from selection
     */
    const items: Wrapper[] = Array.from(this.selectedItems.values()).filter(p => p.type === 'Node');
    for (const wrapper of items) {
      this.selectedItems.delete(wrapper.nodeId);
    }
    this.selectListSubject.next({items, selected: false});
  }

  public removeAllCancerDriverNodes() {
    /**
     * removes all cancer driver genes from selection
     */
    const items: Wrapper[] = Array.from(this.selectedItems.values()).filter(p => p.type === 'CancerNode');
    for (const wrapper of items) {
      this.selectedItems.delete(wrapper.nodeId);
    }
    this.selectListSubject.next({items, selected: false});
  }

  resetSelection() {
    /**
     * clears selection
     */
    this.selectedItems.clear();
    this.selectListSubject.next({items: [], selected: null});
  }

  idInSelection(nodeId: string): boolean {
    /**
     * checks if nodeId is in selected items
     */
    return this.selectedItems.has(nodeId);
  }

  inSelection(wrapper: Wrapper): boolean {
    /**
     * checks if wrapper is in selection
     */
    return this.selectedItems.has(wrapper.nodeId);
  }

  nodeInSelection(node: Node): boolean {
    /**
     * Checks if node is in selection
     */
    return this.inSelection(getWrapperFromNode(node));
  }

  cancerNodeInSelection(cancerNode: CancerNode): boolean {
    /**
     * Checks if cancer Node is in selection
     */
    return this.inSelection(getWrapperFromCancerNode(cancerNode));
  }

  getSelection(): Wrapper[] {
    /**
     * Returns selection
     */
    return Array.from(this.selectedItems.values());
  }

  getCount(): number {
    /**
     * Returns number of selected items
     */
    return this.selectedItems.size;
  }

  subscribeList(cb: (items: Array<Wrapper>, selected: boolean | null) => void) {
    /**
     * subscribes to checkboxes, 'this.selectListSubject'
     */
    this.selectListSubject.subscribe((event) => {
      cb(event.items, event.selected);
    });
  }

  async startQuickAnalysis(
    isSuper: boolean,
    dataset: Dataset,
    geneInteractionDataset: Dataset,
    drugInteractionDataset: Dataset,
    cancerTypes: CancerType[]) {
    /**
     * Starts quick analysis
     */
    // break if maximum number of tasks exceeded
    if (!this.canLaunchTask()) {
      toast({
        message: `You can only run ${MAX_TASKS} tasks at once. Please wait for one of them to finish or delete it from the task list.`,
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
        type: 'is-danger',
        position: 'top-center',
        animate: {in: 'fadeIn', out: 'fadeOut'}
      });
      return;
    }

    this.launchingQuick = true;

    // parse cancer type items to backendId-string-format '1,6,9,..'
    const cancerTypesIds = cancerTypes.map( (cancerType) => cancerType.backendId);
    const resp = await this.control.postTask(
      isSuper ? 'super' : 'quick',
      'drug',
      {
        dataset: dataset.name,
        gene_interaction_dataset: geneInteractionDataset.name,
        drug_interaction_dataset: drugInteractionDataset.name,
        cancer_types: cancerTypesIds,
        bait_datasets: dataset.data,
        seeds: isSuper ? [] : this.getSelection().map((i) => 'g' + i.data.backendId),
      }
    );
    this.tokens.push(resp.token);
    this.startWatching();

    toast({
      message: 'Quick analysis started. This may take a while.' +
        ' Once the computation finished you can view the results in the task list to the right.',
      duration: 10000,
      dismissible: true,
      pauseOnHover: true,
      type: 'is-success',
      position: 'top-center',
      animate: {in: 'fadeIn', out: 'fadeOut'}
    });
  }

  async startAnalysis(algorithm, target: 'drug' | 'drug-target', parameters) {
    /**
     * Starts analysis, NOT QUICK
     * accepts algorithm with parameters
     */
    if (!this.canLaunchTask()) {
      toast({
        message: `You can only run ${MAX_TASKS} tasks at once. Please wait for one of them to finish or delete it from the task list.`,
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
        type: 'is-danger',
        position: 'top-center',
        animate: {in: 'fadeIn', out: 'fadeOut'}
      });
      return;
    }

    const resp = await this.http.post<any>(`${environment.backend}task/`, {
      algorithm,
      target,
      parameters,
    }).toPromise();
    this.tokens.push(resp.token);
    localStorage.setItem('tokens', JSON.stringify(this.tokens));
    this.startWatching();
  }

  public isLaunchingQuick(): boolean {
    /**
     * returns status (boolean) of this.launchingQuick
     *
     * indicates whether launch is ongoing
     */
    return this.launchingQuick;
  }

  public showToast(task: Task, status: 'DONE' | 'FAILED') {
    /**
     * Shows message about task status to user
     */
    let toastMessage;
    let toastType;
    if (status === 'DONE') {
      toastMessage = 'Computation finished successfully. Click the task in the task list to view the results.';
      toastType = 'is-success';
    } else if (status === 'FAILED') {
      toastMessage = 'Computation failed.';
      toastType = 'is-danger';
    }

    toast({
      message: toastMessage,
      duration: 5000,
      dismissible: true,
      pauseOnHover: true,
      type: toastType,
      position: 'top-center',
      animate: {in: 'fadeIn', out: 'fadeOut'}
    });
  }

  public canLaunchTask(): boolean {
    /**
     * return if launch of task is possible
     */
    return this.canLaunchNewTask;
  }

  public startWatching() {
    /**
     * start watching for task to finish
     *
     * Shows toast on task finish
     */
    const watch = async () => {
      if (this.tokens.length > 0) {
        this.tasks = await this.getTasks();
        if (!this.tasks) {
          return;
        }
        let queuedOrRunningTasks = 0;
        this.tasks.forEach((task) => {
          if (!task.info.done && !task.info.failed) {
            queuedOrRunningTasks++;
          }
          if (!this.finishedTokens.find((finishedToken) => finishedToken === task.token)) {
            if (task.info.done) {
              this.finishedTokens.push(task.token);
              this.showToast(task, 'DONE');
              localStorage.setItem('finishedTokens', JSON.stringify(this.finishedTokens));
            } else if (task.info.failed) {
              this.finishedTokens.push(task.token);
              this.showToast(task, 'FAILED');

              localStorage.setItem('finishedTokens', JSON.stringify(this.finishedTokens));
            } else {
            }
          }
        });
        this.canLaunchNewTask = queuedOrRunningTasks < MAX_TASKS;
      } else {
        this.canLaunchNewTask = true;
      }
      this.launchingQuick = false;
    };
    watch();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(watch, 5000);
  }


}
