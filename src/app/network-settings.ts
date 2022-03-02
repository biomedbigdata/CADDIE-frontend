import {WrapperType} from './interfaces';
import {getGradientColor} from './utils';

export class NetworkSettings {

  // parameters for click timing
  public static doubleClickTime: Date = new Date();
  public static t0: Date = new Date();
  public static threshold = 200;

  // Node color
  public static node = '#143d1f';
  public static cancerNode = '#5b005b';
  public static approvedDrugColor = '#0080ff'; // a3185e
  public static unapprovedDrugColor = '#d88c00';
  public static nonSeedGeneColor = '#143d1f';
  public static seedGeneColor = '#3ab159';
  public static nonSeedCancerGeneColor = '#5b005b';
  public static seedCancerGeneColor = '#ff007f';

  public static selectedBorderColor = '#ffa500';
  public static selectBorderHighlightColor = '#ffa500';
  
  public static cancernetFontColor = '#9c0606';

  // Edge color
  private static edgeGeneCancerGeneColor = '#686868';
  private static edgeGeneCancerGeneHighlightColor = '#686868';
  private static edgeGeneDrugColor = '#686868';
  private static edgeGeneDrugHighlightColor = '#686868';

  // Border width
  private static selectedBorderWidth = 3;
  private static selectedBorderWidthSelected = 3;

  private static borderWidth = 1;
  private static borderWidthSelected = 3;

  // Node Font
  private static GeneFontSize = 20;
  private static cancerGeneFontSize = 25;
  private static drugFontSize = 30;
  private static geneFontColor = '#FFFFFF';
  private static cancerGeneFontColor = '#FFFFFF';
  private static drugFontColor = '#FFFFFF';
  private static drugCancerFontColor = 'black';

  // Network Layout
  private static analysisLayout = {
    improvedLayout: false,
  };
  private static analysisEdges = {
    smooth: false,
  };
  private static analysisPhysics = {
    enabled: true,
    solver: 'barnesHut',
    barnesHut: {
      theta: 0.1,
      gravitationalConstant: -50000,
      centralGravity: 5,
      springLength: 100,
      springConstant: 0.8,
      damping: 0.5,
      avoidOverlap: 1,
    },
    stabilization: {
      enabled: true,
      iterations: 250
    }
  };
  private static analysisBigPhysics = {
    enabled: true,
    solver: 'barnesHut',
    barnesHut: {
      theta: 0.5,
      gravitationalConstant: -50000,
      centralGravity: 5,
      springLength: 200,
      springConstant: 0.4,
      damping: 0.5,
      avoidOverlap: 1,
    },
    stabilization: {
      enabled: true,
      iterations: 250
    }
  };

  private static mainLayout = {
    improvedLayout: false,
  };
  private static mainEdges = {
    selfReferenceSize: 0,
    smooth: false,
//    length: 500,
  };
  private static mainPhysics = {
    enabled: true,
    solver: 'barnesHut',
    barnesHut: {
      theta: 0.7,
      gravitationalConstant: -50000,
      centralGravity: 5,
      springLength: 400,
      springConstant: 0.04,
      damping: 0.09,
      avoidOverlap: 1,
    },
    stabilization: {
      enabled: true,
      iterations: 200
    }
  };

  // Node size
  private static nodeSize = 15;
  private static cancerNodeSize = 25;
  private static drugSize = 20;

  // Node shape
  private static hostShape = 'ellipse';
  private static virusShape = 'ellipse';
  private static drugShape = 'box';
  private static drugCancerShape = 'triangle';

  static getNodeSize(wrapperType: WrapperType) {
    if (wrapperType === 'Node') {
      return this.nodeSize;
    } else if (wrapperType === 'CancerNode') {
      return this.cancerNodeSize;
    } else if (wrapperType === 'Drug') {
      return this.drugSize;
    }
  }

  static getCancernetFontColor() {
    return this.cancernetFontColor;
  }

  static getNodeShape(wrapperType: WrapperType, cancerDrug?: boolean) {
    if (wrapperType === 'Node') {
      return this.hostShape;
    } else if (wrapperType === 'CancerNode') {
      return this.virusShape;
    } else if (wrapperType === 'Drug') {
      if (cancerDrug) {
        return this.drugCancerShape;
      } else {
        return this.drugShape;
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

  static getColor(color: 'Node' | 'CancerNode' | 'approvedDrug' | 'unapprovedDrug' | 'geneFont' | 'cancerFont' | 'drugFont' |
    'nonSeedGene' | 'nonSeedCancerDriverGenes' | 'selectedForAnalysis' | 'selectedForAnalysisText' |
    'edgeGene' | 'edgeGeneHighlight' | 'edgeGeneCancer' | 'edgeGeneCancerHighlight' | 'edgeGeneDrug' | 'edgeGeneDrugHighlight' |
    'seedGene' | 'seedCancerGene') {
    /**
     * Collection of all colors per use-case
     */
    if (color === 'Node') {
      return this.node;
    } else if (color === 'CancerNode') {
      return this.cancerNode;
    } else if (color === 'approvedDrug') {
      return this.approvedDrugColor;
    } else if (color === 'unapprovedDrug') {
      return this.unapprovedDrugColor;
    } else if (color === 'geneFont') {
      return this.geneFontColor;
    } else if (color === 'cancerFont') {
      return this.cancerGeneFontColor;
    } else if (color === 'drugFont') {
      return this.drugFontColor;
    } else if (color === 'nonSeedGene') {
      return this.nonSeedGeneColor;
    } else if (color === 'nonSeedCancerDriverGenes') {
      return this.nonSeedCancerGeneColor;
    } else if (color === 'seedGene') {
      return this.seedGeneColor;
    } else if (color === 'seedCancerGene') {
      return this.seedCancerGeneColor;
    } else if (color === 'edgeGene') {
      return this.edgeGeneCancerGeneColor;
    } else if (color === 'edgeGeneCancer') {
      return this.edgeGeneCancerGeneColor;
    } else if (color === 'edgeGeneCancerHighlight') {
      return this.edgeGeneCancerGeneColor;
    } else if (color === 'edgeGeneDrug') {
      return this.edgeGeneDrugColor;
    } else if (color === 'edgeGeneHighlight') {
      return this.edgeGeneCancerGeneHighlightColor;
    } else if (color === 'edgeGeneDrugHighlight') {
      return this.edgeGeneDrugHighlightColor;
    }
  }

  static getFont(wrapperType: WrapperType, cancerDrug?: boolean) {
    if (wrapperType === 'Node') {
      return {color: this.geneFontColor, size: this.GeneFontSize};
    } else if (wrapperType === 'CancerNode') {
      return {color: this.cancerGeneFontColor, size: this.cancerGeneFontSize};
    } else if (wrapperType === 'Drug') {
      if (!cancerDrug) {
        return {color: this.drugFontColor, size: this.drugFontSize};
      } else {
        return {color: this.drugCancerFontColor, size: this.drugFontSize};
      }
    }
  }

  static getNodeStyle(nodeType: WrapperType,
                      isSeed: boolean,
                      isSelected: boolean,
                      drugType?: string,
                      isATCClassL?: boolean,
                      gradient?: number,
                      inCancernet?: boolean): any {
    if (!gradient) {
      gradient = 1.0;
    }
    let nodeColor;
    let nodeShape;
    let nodeSize;
    let nodeFont;
    let nodeBorderColor;
    const nodeShadow = true;
    nodeShape = NetworkSettings.getNodeShape(nodeType);
    nodeSize = NetworkSettings.getNodeSize(nodeType);
    nodeFont = NetworkSettings.getFont(nodeType);
    if (nodeType === 'Node') {
      nodeColor = NetworkSettings.getColor(nodeType);
      nodeFont = NetworkSettings.getFont('Node');
      if (isSeed !== undefined) {
        if (!isSeed) {
          nodeColor = NetworkSettings.getColor('nonSeedGene');
        } else {
          nodeColor = NetworkSettings.getColor('seedGene');
        }
      }
    } else if (nodeType === 'CancerNode') {
      nodeColor = NetworkSettings.getColor(nodeType);
      if (nodeType === 'CancerNode') {
        nodeFont = NetworkSettings.getFont('CancerNode');
        if (isSeed !== undefined) {
          if (!isSeed) {
            nodeColor = NetworkSettings.getColor('nonSeedCancerDriverGenes');
          } else {
            nodeColor = NetworkSettings.getColor('seedCancerGene');
          }
        }
      }
    } else if (nodeType === 'Drug') {
      if (drugType === 'approved') {
        nodeColor = NetworkSettings.getColor('approvedDrug');
      } else {
        nodeColor = NetworkSettings.getColor('unapprovedDrug');
      }
      if (isATCClassL) {
        nodeShape = NetworkSettings.getNodeShape('Drug', true);
        nodeFont = NetworkSettings.getFont('Drug', true);
      } else {
        nodeShape = NetworkSettings.getNodeShape('Drug', false);
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
      node.color = {
        background: nodeColor,
        border: nodeColor,
        highlight: {
          background: nodeColor,
          border: nodeColor
        },
      }
      node.borderWidth = this.borderWidth;
      node.borderWidthSelected = this.borderWidthSelected;
    }

    // in cancernet
    // if (inCancernet) {
    //   node.font = {
    //     color: NetworkSettings.getCancernetFontColor(),
    //     bold: true,
    //     size: 30
    //   }
    // }

    return node;
  }



}

