import {HttpClient} from '@angular/common/http';
import {
  Interaction,
  CancerNode,
  Node,
  getGeneNodeId,
  getCancerDriverGeneNodeId,
  Dataset
} from './interfaces';

export function getDatasetFilename(dataset: Dataset): string {
  return `network-${JSON.stringify(dataset.name).replace(/[\[\]\",]/g, '')}.json`;
}

export class Network {

  constructor(
    public nodes: Node[],
    public cancerNodes: CancerNode[],
    public edges: Interaction[]) {
  }

  public async loadPositionsFromFile(http: HttpClient, dataset: Dataset) {
    const nodePositions = await http.get(`assets/positions/${getDatasetFilename(dataset)}`).toPromise();
    this.nodes.forEach((node) => {
      const nodePosition = nodePositions[getGeneNodeId(node)];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
    this.cancerNodes.forEach((node) => {
      const nodePosition = nodePositions[getCancerDriverGeneNodeId(node)];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
  }

  public getNode(backend_id: string): Node | undefined {
    /**
     * Returns Gene/Protein in network with corresponding backend_id
     */
    return this.nodes.find((g) => g.backendId === backend_id);
  }

  public getCancerNode(backend_id: string): CancerNode | undefined {
    /**
     * Returns Gene/protein in network with corresponding backend_id
     */
    return this.cancerNodes.find((g) => g.backendId === backend_id);
  }

  public linkNodes() {
    /**
     * Links ALL nodes (cancer and non-cancer) in the network based on their interactions to all related nodes
     */
    // reset all interactions
    this.nodes.forEach((g) => {
      g.interactions = [];
    });
    // reset all interactions
    this.cancerNodes.forEach((cdg) => {
      cdg.interactions = [];
    });
    // set interactions
    this.edges.forEach((interaction) => {
      const nodeA = this.getNode(interaction.interactorABackendId) || this.getCancerNode(interaction.interactorABackendId);
      const nodeB = this.getNode(interaction.interactorBBackendId) || this.getCancerNode(interaction.interactorBBackendId);

      if (nodeA && nodeB) {
        nodeA.interactions.push(nodeB);
        nodeB.interactions.push(nodeA);
      }
    });
  }

}
