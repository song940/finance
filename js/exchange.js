// Function to query exchange history.
// The result will be a promise-wrapped array, for example:
//   [{ date: new Date('2020-01-01', rate: 1.05 }]
const query = async (baseCurrency, targetCurrency, fromDate, toDate) => {
  const res = await fetch(`https://api.frankfurter.app/${fromDate}..${toDate}?from=${baseCurrency}&to=${targetCurrency}`);
  const data = await res.json();
  const { error, rates } = data;
  if (error) throw new Error(error);
  return Object
    .entries(rates)
    .map(([date, rate]) => ({
      date: new Date(date),
      rate: Math.floor(1000 * rate[targetCurrency]) / 1000
    }))
    .sort((a, b) => a.date - b.date)
};

// Function to render exchange history graph.
const renderGraph = async dataset => {
  const svg = d3.select("#graph-container").select('svg');

  // Reset width & height.
  svg.attr('width', null).attr('height', null);

  // Clear old child-nodes.
  svg.selectAll('*').remove();


  // Dimensions.
  let
    width = document.getElementById('graph-container').clientWidth,
    height = document.getElementById('graph-container').clientHeight,
    padding = 50;

  if (height > width) {

    height = width;
  }

  // Scales.
  const
    xScale = d3
      .scaleTime()
      .domain([d3.min(dataset, ({ date }) => date), d3.max(dataset, ({ date }) => date)])
      .range([padding, width - padding]),
    yScale = d3
      .scaleLinear()
      .domain([d3.min(dataset, ({ rate }) => rate), d3.max(dataset, ({ rate }) => rate)])
      .range([height - padding, padding]);

  // Set width & height.
  svg.attr("width", width).attr("height", height);

  // X-Axis.
  svg
    .append("g")
    .attr("transform", `translate(0,${height - padding})`)
    .call(d3.axisBottom(xScale));

  // Y-Axis.
  svg
    .append("g")
    .attr("transform", `translate(${padding},0)`)
    .call(d3.axisLeft(yScale));

  // Line.
  svg
    .append("path")
    .datum(dataset)
    .attr("fill", "none")
    .attr("stroke", "yellow")
    .attr("stroke-width", 1.0)
    .attr("stroke-linejoin", "milter")
    .attr("stroke-linecap", "round")
    .attr("d", d3.line().x(({ date }) => xScale(date)).y(({ rate }) => yScale(rate)));

  // Tooltip.
  const tooltip = svg
    .append('g')
    .attr('display', 'none');

  const tooltipRatio = 0.8;

  tooltip
    .append('rect')
    .attr('width', 220 * tooltipRatio)
    .attr('height', 60 * tooltipRatio)
    .attr('fill', 'rgba(255, 255, 255, 0.9)')
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('x', -110 * tooltipRatio)
    .attr('y', -30 * tooltipRatio);

  tooltip
    .append('line')
    .attr('x1', 0)
    .attr('y1', -30 * tooltipRatio)
    .attr('x2', 0)
    .attr('y2', -10000)
    .attr('stroke-width', 1.0)
    .attr('stroke', 'white')
    .attr('stroke-dasharray', '5,5');

  tooltip
    .append('line')
    .attr('x1', 0)
    .attr('y1', 30 * tooltipRatio)
    .attr('x2', 0)
    .attr('y2', 10000)
    .attr('stroke-width', 1.0)
    .attr('stroke', 'white')
    .attr('stroke-dasharray', '5,5');

  tooltip
    .append('line')
    .attr('x1', -110 * tooltipRatio)
    .attr('y1', 0)
    .attr('x2', -10000)
    .attr('y2', 0)
    .attr('stroke-width', 1.0)
    .attr('stroke', 'white')
    .attr('stroke-dasharray', '5,5');

  tooltip
    .append('line')
    .attr('x1', 110 * tooltipRatio)
    .attr('y1', 0)
    .attr('x2', 10000)
    .attr('y2', 0)
    .attr('stroke-width', 1.0)
    .attr('stroke', 'white')
    .attr('stroke-dasharray', '5,5');

  const tooltipTextRows = [
    tooltip
      .append('text')
      .attr('x', -103 * tooltipRatio)
      .attr('y', -7 * tooltipRatio)
      .attr('font-size', 16 * tooltipRatio),
    tooltip
      .append('text')
      .attr('x', -103 * tooltipRatio)
      .attr('y', 23 * tooltipRatio)
      .attr('font-size', 16 * tooltipRatio),
  ];

  svg.on("touchmove mousemove", () => {
    const mouseX = d3.mouse(d3.event.currentTarget)[0];

    let minDistance = Infinity,
      minOrder = null;

    dataset.forEach(({ date, rate }, order) => {
      const currentDistance = Math.abs(xScale(date) - mouseX);
      if (currentDistance < minDistance) {
        minDistance = currentDistance;
        minOrder = order;
      }
    });

    if (minOrder !== null) {
      const { date, rate } = dataset[minOrder];
      tooltip
        .attr('display', '')
        .attr('transform', `translate(${xScale(date)}, ${yScale(rate)})`);
      tooltipTextRows[0].text(`1 ${baseCurrency} = ${rate} ${targetCurrency}`);
      tooltipTextRows[1].text(`${date.toDateString()}`);
    }
  });

  // TODO: mouseleave...
};

// Bind callback after the content has been loaded.
document.addEventListener('DOMContentLoaded', () => {

  // Get all input elements.
  const inputs = {
    baseCurrency: document.getElementById('base-currency'),
    targetCurrency: document.getElementById('target-currency'),
    fromDate: document.getElementById('from-date'),
    toDate: document.getElementById('to-date'),
  };

  // Function to refresh graph.
  const refreshGraph = async () => {
    const
      baseCurrency = inputs.baseCurrency.value,
      targetCurrency = inputs.targetCurrency.value,
      fromDate = inputs.fromDate.value,
      toDate = inputs.toDate.value;

    const data = await query(baseCurrency, targetCurrency, fromDate, toDate)
    renderGraph(data);
  }

  // Bind refresh callback for input changes.
  Object
    .values(inputs)
    .forEach(input => input.addEventListener('change', refreshGraph));

  // Bind refresh callback for resizing window.
  // window.addEventListener('resize', refreshGraph);

  const baseCurrency = 'NZD';
  const targetCurrency = 'CNY';

  const fromDate = new Date(Date.now() - 1000 * 3600 * 24 * 365).toISOString().substr(0, 10);
  const toDate = new Date(Date.now()).toISOString().substr(0, 10);

  inputs.baseCurrency.value = baseCurrency;
  inputs.targetCurrency.value = targetCurrency;
  inputs.fromDate.value = fromDate;
  inputs.toDate.value = toDate;

  refreshGraph();
});