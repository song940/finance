import { ready } from 'https://lsong.org/scripts/dom.js';
import { format } from 'https://lsong.org/scripts/time.js';
import * as echarts from 'https://unpkg.com/echarts@5.4.1/dist/echarts.esm.js'

// function splitData(rawData) {
//   let categoryData = [];
//   let values = [];
//   let volumes = [];
//   for (let i = 0; i < rawData.length; i++) {
//     categoryData.push(rawData[i].splice(0, 1)[0]);
//     values.push(rawData[i]);
//     volumes.push([i, rawData[i][4], rawData[i][0] > rawData[i][1] ? 1 : -1]);
//   }
//   return {
//     categoryData: categoryData,
//     values: values,
//     volumes: volumes
//   };
// }

const buildOption = data => {
  const upColor = '#ec0000';
  const downColor = '#00da3c';
  return {
    animation: false,
    legend: {
      bottom: 10,
      left: 'center',
      data: ['Dow-Jones index']
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 10,
      textStyle: {
        color: '#000'
      },
    },
    axisPointer: {
      link: [
        {
          xAxisIndex: 'all'
        }
      ],
      label: {
        backgroundColor: '#777'
      }
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: false
        },
        brush: {
          type: ['lineX', 'clear']
        }
      }
    },
    brush: {
      xAxisIndex: 'all',
      brushLink: 'all',
      outOfBrush: {
        colorAlpha: 0.1
      }
    },
    visualMap: {
      show: false,
      seriesIndex: 1,
      dimension: 2,
      pieces: [
        {
          value: 1,
          color: downColor
        },
        {
          value: -1,
          color: upColor
        }
      ]
    },
    grid: [
      {
        left: '10%',
        right: '8%',
        height: '50%'
      },
      {
        left: '10%',
        right: '8%',
        top: '63%',
        height: '16%'
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: data.categories,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax',
        axisPointer: {
          z: 100
        }
      },
      {
        type: 'category',
        gridIndex: 1,
        data: data.categoryData,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        min: 'dataMin',
        max: 'dataMax'
      }
    ],
    yAxis: [
      {
        scale: true,
        splitArea: {
          show: true
        }
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: 0,
        end: 100
      },
      {
        show: true,
        xAxisIndex: [0, 1],
        type: 'slider',
        top: '80%',
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: 'Dow-Jones index',
        type: 'candlestick',
        data: data.values,
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: undefined,
          borderColor0: undefined
        },
      },
      {
        name: 'Volume',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: data.volumes
      }
    ]
  };
};

const fetchData = async () => {
  // const res = await fetch(`https://api.huobi.pro/market/history/kline?period=1day&size=200&symbol=btcusdt`)
  const res = await fetch(`https://api.lsong.one:8443/huobi/market/history/kline?period=1day&size=200&symbol=btcusdt`)
  const data = await res.json();
  const categories = [], values = [], volumes = [];
  for (const row of data.data.sort((a, b) => a.id - b.id)) {
    categories.push(format('{yyyy}-{MM}-{dd}', new Date(row.id * 1000)));
    volumes.push([row.vol, row.vol, row.open > row.close ? 1 : -1]);
    values.push([row.open, row.close, row.low, row.high]);
  }
  return { categories, values, volumes };
};

ready(async () => {
  const app = document.getElementById('app');
  const chart = echarts.init(app);
  const data = await fetchData();
  const option = buildOption(data);
  chart.setOption(option, true);
});
