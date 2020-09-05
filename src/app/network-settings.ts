import {WrapperType} from './interfaces';
import {getGradientColor} from './utils';

export class NetworkSettings {

  // Node color
  private static hostColor = '#123456';
  private static virusColor = '#BE093C';
  private static approvedDrugColor = '#48C774';
  private static unapprovedDrugColor = '#F8981D';
  private static nonSeedHostColor = '#3070B3';
  private static nonSeedVirusColor = '#87082c';

  private static selectedBorderColor = '#F8981D';
  private static selectBorderHighlightColor = '#F8981D';

  // Edge color
  private static edgeHostVirusColor = '#686868';
  private static edgeHostVirusHighlightColor = '#686868';
  private static edgeHostDrugColor = '#686868';
  private static edgeHostDrugHighlightColor = '#686868';

  // Border width
  private static selectedBorderWidth = 3;
  private static selectedBorderWidthSelected = 3;

  private static borderWidth = 1;
  private static borderWidthSelected = 3;

  // Node Font
  private static hostFontSize = 20;
  private static virusFontSize = 50;
  private static drugFontSize = 30;
  private static hostFontColor = '#FFFFFF';
  private static virusFontColor = '#FFFFFF';
  private static drugFontColor = '#FFFFFF';
  private static drugInTrialFontColor = 'black';

  // Network Layout
  private static analysisLayout = {
    improvedLayout: true,
  };
  private static analysisEdges = {
    smooth: false,
  };
  private static analysisPhysics = {
    enabled: true,
    stabilization: {
      enabled: true,
    },
    repulsion: {
      centralGravity: 0,
    },
    solver: 'repulsion',
  };
  private static analysisBigPhysics = {
    enabled: false,
  };

  private static mainLayout = {
    improvedLayout: false,
  };
  private static mainEdges = {
    smooth: false,
  //  length: 250,
  };
  private static mainPhysics = {
    solver: 'barnesHut',
    barnesHut: {
      theta: 1,
      gravitationalConstant: -30000,
      centralGravity: 0.0,
      springLength: 500,
      springConstant: 0.8,
      damping: 0.5,
      avoidOverlap: 1,
    },
    stabilization: {
      enabled: true,
      iterations: 1000
    },
  };

  // Node size
  private static nodeSize = 20;
  private static cancerNodeSize = 30;
  private static drugSize = 15;

  // Node shape
  private static hostShape = 'ellipse';
  private static virusShape = 'ellipse';
  private static drugNotInTrialShape = 'box';
  private static drugInTrialShape = 'triangle';

  static getNodeSize(wrapperType: WrapperType) {
    if (wrapperType === 'node') {
      return this.nodeSize;
    } else if (wrapperType === 'cancerNode') {
      return this.cancerNodeSize;
    } else if (wrapperType === 'drug') {
      return this.drugSize;
    }
  }

  static getNodeShape(wrapperType: WrapperType, drugInTrial?: boolean) {
    if (wrapperType === 'node') {
      return this.hostShape;
    } else if (wrapperType === 'cancerNode') {
      return this.virusShape;
    } else if (wrapperType === 'drug') {
      if (drugInTrial) {
        return this.drugInTrialShape;
      } else {
        return this.drugNotInTrialShape;
      }
    }
  }

  static getOptions(network: 'main' | 'analysis' | 'analysis-big') {
    if (network === 'main') {
      return {
        layout: this.mainLayout,
        edges: this.mainEdges,
        physics: this.mainPhysics,
      };
    } else if (network === 'analysis') {
      return {
        layout: this.analysisLayout,
        edges: this.analysisEdges,
        physics: this.analysisPhysics,
      };
    } else if (network === 'analysis-big') {
      return {
        layout: this.analysisLayout,
        edges: this.analysisEdges,
        physics: this.analysisBigPhysics,
      };
    }
  }

  static getColor(color: 'node' | 'cancerNode' | 'approvedDrug' | 'unapprovedDrug' | 'geneFont' | 'cancerFont' | 'drugFont' |
    'nonSeedGene' | 'nonSeedCancerDriverGenes' | 'selectedForAnalysis' | 'selectedForAnalysisText' |
    'edgeGene' | 'edgeGeneHighlight' | 'edgeGeneCancer' | 'edgeGeneCancerHighlight' | 'edgeGeneDrug' | 'edgeGeneDrugHighlight') {
    /**
     * Collection of all colors per use-case
     */
    if (color === 'node') {
      return this.hostColor;
    } else if (color === 'cancerNode') {
      return this.virusColor;
    } else if (color === 'approvedDrug') {
      return this.approvedDrugColor;
    } else if (color === 'unapprovedDrug') {
      return this.unapprovedDrugColor;
    } else if (color === 'geneFont') {
      return this.hostFontColor;
    } else if (color === 'cancerFont') {
      return this.virusFontColor;
    } else if (color === 'drugFont') {
      return this.drugFontColor;
    } else if (color === 'nonSeedGene') {
      return this.nonSeedHostColor;
    } else if (color === 'nonSeedCancerDriverGenes') {
      return this.nonSeedVirusColor;
    } else if (color === 'edgeGene') {
      return this.edgeHostVirusColor;
    } else if (color === 'edgeGeneCancer') {
      return this.edgeHostVirusColor;
    } else if (color === 'edgeGeneCancerHighlight') {
      return this.edgeHostVirusColor;
    } else if (color === 'edgeGeneDrug') {
      return this.edgeHostDrugColor;
    } else if (color === 'edgeGeneHighlight') {
      return this.edgeHostVirusHighlightColor;
    } else if (color === 'edgeGeneDrugHighlight') {
      return this.edgeHostDrugHighlightColor;
    }
  }

  static getFont(wrapperType: WrapperType, drugInTrial?: boolean) {
    if (wrapperType === 'node') {
      return {color: this.hostFontColor, size: this.hostFontSize};
    } else if (wrapperType === 'cancerNode') {
      return {color: this.virusFontColor, size: this.virusFontSize};
    } else if (wrapperType === 'drug') {
      if (!drugInTrial) {
        return {color: this.drugFontColor, size: this.drugFontSize};
      } else {
        return {color: this.drugInTrialFontColor, size: this.drugFontSize};
      }
    }
  }

  static getNodeStyle(nodeType: WrapperType,
                      isSeed: boolean,
                      isSelected: boolean,
                      drugType?: string,
                      drugInTrial?: boolean,
                      gradient?: number): any {
    if (!gradient) {
      gradient = 1.0;
    }
    let nodeColor;
    let nodeShape;
    let nodeSize;
    let nodeFont;
    const nodeShadow = true;
    nodeShape = NetworkSettings.getNodeShape(nodeType);
    nodeSize = NetworkSettings.getNodeSize(nodeType);
    nodeFont = NetworkSettings.getFont(nodeType);
    if (nodeType === 'node') {
      nodeColor = NetworkSettings.getColor(nodeType);
      nodeFont = NetworkSettings.getFont('node');
      if (!isSeed) {
        nodeColor = NetworkSettings.getColor('nonSeedGene');
      }
    } else if (nodeType === 'cancerNode') {
      nodeColor = NetworkSettings.getColor(nodeType);
      if (nodeType === 'cancerNode') {
        nodeFont = NetworkSettings.getFont('cancerNode');
        if (!isSeed) {
          nodeColor = NetworkSettings.getColor('nonSeedCancerDriverGenes');
        }
      }
    } else if (nodeType === 'drug') {
      if (drugType === 'approved') {
        nodeColor = NetworkSettings.getColor('approvedDrug');
      } else {
        nodeColor = NetworkSettings.getColor('unapprovedDrug');
      }
      if (drugInTrial) {
        nodeShape = NetworkSettings.getNodeShape('drug', true);
        nodeFont = NetworkSettings.getFont('drug', true);
      } else {
        nodeShape = NetworkSettings.getNodeShape('drug', false);
      }
    }

    if (gradient === -1) {
      nodeColor = '#A0A0A0';
    } else {
      nodeColor = getGradientColor('#FFFFFF', nodeColor, gradient);
    }

    const node: any = {
      size: nodeSize,
      shape: nodeShape,
      font: nodeFont,
      shadow: nodeShadow,
    };

    if (isSelected) {
      node.color = {
        background: nodeColor,
        border: this.selectedBorderColor,
        highlight: {
          border: this.selectBorderHighlightColor,
          background: nodeColor,
        },
      };

      node.borderWidth = this.selectedBorderWidth;
      node.borderWidthSelected = this.selectedBorderWidthSelected;
    } else {
      node.color = nodeColor;

      node.borderWidth = this.borderWidth;
      node.borderWidthSelected = this.borderWidthSelected;
    }

    return node;
  }
}

