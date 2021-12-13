// From https://stackoverflow.com/a/27709336/3850564

export function getGradientColor(startColor: string, endColor: string, percent: number) {
  // strip the leading # if it's there
  startColor = startColor.replace(/^\s*#|\s*$/g, '');
  endColor = endColor.replace(/^\s*#|\s*$/g, '');

  // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
  if (startColor.length === 3) {
    startColor = startColor.replace(/(.)/g, '$1$1');
  }

  if (endColor.length === 3) {
    endColor = endColor.replace(/(.)/g, '$1$1');
  }

  // get colors
  const startRed = parseInt(startColor.substr(0, 2), 16);
  const startGreen = parseInt(startColor.substr(2, 2), 16);
  const startBlue = parseInt(startColor.substr(4, 2), 16);

  const endRed = parseInt(endColor.substr(0, 2), 16);
  const endGreen = parseInt(endColor.substr(2, 2), 16);
  const endBlue = parseInt(endColor.substr(4, 2), 16);

  // calculate new color
  const diffRed = endRed - startRed;
  const diffGreen = endGreen - startGreen;
  const diffBlue = endBlue - startBlue;

  let diffRedStr = `${((diffRed * percent) + startRed).toString(16).split('.')[0]}`;
  let diffGreenStr = `${((diffGreen * percent) + startGreen).toString(16).split('.')[0]}`;
  let diffBlueStr = `${((diffBlue * percent) + startBlue).toString(16).split('.')[0]}`;

  // ensure 2 digits by color
  if (diffRedStr.length === 1) {
    diffRedStr = '0' + diffRedStr;
  }
  if (diffGreenStr.length === 1) {
    diffGreenStr = '0' + diffGreenStr;
  }
  if (diffBlueStr.length === 1) {
    diffBlueStr = '0' + diffBlueStr;
  }

  return '#' + diffRedStr + diffGreenStr + diffBlueStr;
}

export function RGBAtoRGB(rgbaString) {
  const rgbaStringSplit = rgbaString.slice(5, -1).split(",");
  const RGBA = {
    red: rgbaStringSplit[0],
    green: rgbaStringSplit[1],
    blue: rgbaStringSplit[2],
    alpha: rgbaStringSplit[3]
  };
  // assume white background
  const bg = {red: 255, green: 255, blue: 255};
  const RGB = {red: undefined, green: undefined, blue: undefined};
  const alpha = 1 - RGBA.alpha;
  RGB.red = Math.round((RGBA.alpha * (RGBA.red / 255) + (alpha * (bg.red / 255))) * 255);
  RGB.green = Math.round((RGBA.alpha * (RGBA.green / 255) + (alpha * (bg.green / 255))) * 255);
  RGB.blue = Math.round((RGBA.alpha * (RGBA.blue / 255) + (alpha * (bg.blue / 255))) * 255);
  return `rgb(${RGB.red},${RGB.green},${RGB.blue})`;
}


export function pieChartContextRenderer({ctx, x, y, state: {selected, hover}, style, label}) {
  ctx.drawPieLabel = function (style, x, y, label) {
    ctx.font = "normal 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.fillText(label, x, y + style.size + 12);
  }

  ctx.drawPie = function (style, x, y) {
    const total = 1;
    // draw shadow
    if (style.shadow) {
      ctx.save()
      ctx.shadowColor = style.shadowColor;
      ctx.shadowOffsetX = style.shadowX;
      ctx.shadowOffsetY = style.shadowY;
      ctx.shadowBlur = 10;
    }
    // draw white background circle
    ctx.beginPath();
    ctx.fillStyle = "white"
    // or fill like background of graph panel
    // ctx.fillStyle= window.getComputedStyle(document.documentElement).getPropertyValue('--drgstn-panel');
    ctx.arc(x, y, style.size, 0, 2 * Math.PI,false);
    ctx.fill();
    ctx.stroke();

    // prepare pi-chart
    ctx.fillStyle = style.color ? style.color : 'rgba(255, 0, 0, 1)';
    // set alpha value to 1
    // ctx.fillStyle = ctx.fillStyle.replace(/[^,]+(?=\))/, '1')
    ctx.fillStyle = RGBAtoRGB(ctx.fillStyle)
    ctx.beginPath();
    ctx.moveTo(x, y);
    const len = style.opacity / total * 2 * Math.PI;
    ctx.arc(x, y, style.size, 0, 0 + len, false);
    ctx.lineTo(x, y);
    ctx.fill();
    if (style.shadow) {
      // removing shadow application of future fill or stroke calls
      ctx.restore();
    }
    ctx.strokeStyle = "black";
    ctx.lineWidth = selected ? 3 : 2;
    if (style.opacity !== total) {
      // avoid the inner line when circle is complete
      ctx.stroke();
    }

    // draw the surrounding border circle
    ctx.beginPath();
    ctx.arc(x, y, style.size, 0, 2 * Math.PI);
    ctx.stroke();
  }

  return {
    // bellow arrows
    // primarily meant for nodes and the labels inside of their boundaries
    drawNode() {
      ctx.drawPie(style, x, y);
    },
    // above arrows
    // primarily meant for labels outside of the node
    drawExternalLabel() {
      ctx.drawPieLabel(style, x, y, label);
    },
    // node dimensions defined by node drawing
    // nodeDimensions: { width: style.size*2, height: style.size*2 },
  };
}

