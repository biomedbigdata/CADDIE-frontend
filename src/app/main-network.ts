import {HttpClient} from '@angular/common/http';
import {
  GeneDriverInteraction,
  CancerDriverGene,
  Gene,
  getGeneNodeId,
  getCancerDriverGeneNodeId,
  Dataset
} from './interfaces';

export function getDatasetFilename(dataset: Dataset): string {
  return `network-${JSON.stringify(dataset.name).replace(/[\[\]\",]/g, '')}.json`;
}

export class GeneNetwork {

  constructor(
    public genes: Gene[],
    public cancer_driver_genes: CancerDriverGene[],
    public edges: GeneDriverInteraction[]) {
  }

  public async loadPositionsFromFile(http: HttpClient, dataset: Dataset) {
    const nodePositions = await http.get(`assets/positions/${getDatasetFilename(dataset)}`).toPromise();
    this.genes.forEach((node) => {
      const nodePosition = nodePositions[getGeneNodeId(node)];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
    this.cancer_driver_genes.forEach((node) => {
      const nodePosition = nodePositions[getCancerDriverGeneNodeId(node)];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
  }

  public getGene(backend_id: string): Gene | undefined {
    /**
     * Returns Gene in network with corresponding backend_id
     */
    return this.genes.find((g) => g.backendId === backend_id);
  }

  public getCancerDriverGene(name: string, cancerType: string, cancerDataset: string): CancerDriverGene | undefined {
    /**
     * Returns CancerDriverGene in network with corresponding name, cancerType and cancerDataset
     */
    return this.cancer_driver_genes.find((cancer_driver_gene) =>
      cancer_driver_gene.geneName === name &&
      cancer_driver_gene.cancerType === cancerType &&
      cancer_driver_gene.datasetName === cancerDataset);
  }

  public linkNodes() {
    /**
     * Links ALL nodes in the network based on their interactions to all related nodes
     */
    this.genes.forEach((g) => {
      g.interactions = [];
    });
    this.cancer_driver_genes.forEach((eff) => {
      eff.interactions = [];
    });
    this.edges.forEach((gene_driver_interaction) => {
      const gene = this.getGene(gene_driver_interaction.id);
      const cancer_driver_gene = this.getCancerDriverGene(
        gene_driver_interaction.geneName,
        gene_driver_interaction.cancerDriverGeneName,
        gene_driver_interaction.datasetName);

      if (gene && cancer_driver_gene) {
        gene.interactions.push(cancer_driver_gene);
        cancer_driver_gene.interactions.push(gene);
      }
    });
  }

}
