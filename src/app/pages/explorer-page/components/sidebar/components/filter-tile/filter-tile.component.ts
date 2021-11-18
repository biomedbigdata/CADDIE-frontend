import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { ExplorerDataService } from 'src/app/services/explorer-data/explorer-data.service';
import {CancerNode, getCancerDriverGeneNodeId, getGeneNodeId} from '../../../../../../interfaces';

@Component({
  selector: 'app-filter-tile',
  templateUrl: './filter-tile.component.html',
  styleUrls: ['./filter-tile.component.scss']
})
export class FilterTileComponent implements OnInit {

  @Input()
  set cancerNodes(cancerNodes) {
    this.filterBuild(cancerNodes)
    return
  }

  public cancerNodesCheckboxes: Array<{ checked: boolean; data: CancerNode }> = [];

  constructor(public explorerData: ExplorerDataService) { }

  ngOnInit(): void {
  }

  public async filterNodes() {
    /**
     * Function related to the Filter tile
     *
     * Filters all gene data on settings in the filter tile
     * +
     * updates network view
     * +
     * updates query items
     */

    const visibleIds = new Set<string>(this.explorerData.activeNetwork.nodeData.nodes.getIds());
    const removeIds = new Set<string>();
    const addNodes = new Map<string, Node>();

    // show all is true if no checkbox is selected
    const showAll = !this.cancerNodesCheckboxes.find((eff) => eff.checked);

    const connectedGenesIds = new Set<string>();

    const filteredCancerDriverGenes = [];
    this.cancerNodesCheckboxes.forEach((cb) => {
      // TODO improve time here by storing them in an object for lookup simplification
      const cancerDriverGenes: Array<CancerNode> = [];
      this.explorerData.activeNetwork.networkData.cancerNodes.forEach((cancerDriverGene) => {
        if (cancerDriverGene.graphId === cb.data.graphId) {
          cancerDriverGenes.push(cancerDriverGene);
        }
      });

      // iterate over found node
      cancerDriverGenes.forEach((cancerDriverGene) => {
        // get node id
        const nodeId = getCancerDriverGeneNodeId(cancerDriverGene);
        // check if node is already visible
        const found = visibleIds.has(nodeId);

        // if node is checked or we wanna show all + it is not yet visible
        if ((cb.checked || showAll) && !found) {
          const node = this.explorerData.mapCancerDriverGeneToNode(cancerDriverGene);
          addNodes.set(node.id, node);
          // we dont want to show all and it is not checked but displayed
        } else if ((!showAll && !cb.checked) && found) {
          // this.nodeData.nodes.remove(nodeId);
          removeIds.add(nodeId);
        }

        // if checked or we wanna show all, get edges
        if (cb.checked || showAll) {
          filteredCancerDriverGenes.push(cancerDriverGene);
          cancerDriverGene.interactions.forEach((gene) => {
            connectedGenesIds.add(gene.backendId);
          });
        }
      });

    }); // end iteration over checkboxes

    const filteredGenes = [];
    for (const gene of this.explorerData.activeNetwork.networkData.nodes) {
      const nodeId = getGeneNodeId(gene);
      const contains = connectedGenesIds.has(gene.backendId);
      const found = visibleIds.has(nodeId);
      if (contains) {
        filteredGenes.push(gene);

        if (!found) {
          const node = this.explorerData.mapGeneToNode(gene);
          addNodes.set(node.id, node);
        }
      } else if (found && !showAll) {
        removeIds.add(nodeId);
      }
    }

    this.explorerData.activeNetwork.nodeData.nodes.remove(Array.from(removeIds.values()));
    this.explorerData.activeNetwork.nodeData.nodes.add(Array.from(addNodes.values()));

    this.explorerData.activeNetwork.visibleCancerNodeCount = filteredCancerDriverGenes.length;
    this.explorerData.activeNetwork.visibleNodeCount = filteredGenes.length;
    // update query options
    this.explorerData.fillQueryItems(filteredGenes, filteredCancerDriverGenes);
  }

  public filterBuild(cancerNodes) {
    // Populate baits
    const cancerDriverGeneNames = [];
    // order cancer driver genes/proteins alphabetically for filter list
    cancerNodes.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    // populate checkboxes
    this.cancerNodesCheckboxes = [];
    cancerNodes.forEach((cancerNode) => {
      const cancerNodeName = cancerNode.name;
      if (cancerDriverGeneNames.indexOf(cancerNodeName) === -1) {
        cancerDriverGeneNames.push(cancerNodeName);
        this.cancerNodesCheckboxes.push({
          checked: false,
          data: cancerNode,
        });
      }
    });
  }

  public filterClear(event) {
    /**
     * Removes all filters from filter tile and calls filterNodes() to show all genes
     */
    const checked = event.target.checked;
    this.cancerNodesCheckboxes.forEach(item => item.checked = checked);
    this.filterNodes();
  }

}
