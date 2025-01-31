import React, { useEffect, useState } from "react";
import { invoke, events } from "@forge/bridge";
import { BarGroupHorizontal, Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale';
import { Text } from '@visx/text';
import { LegendOrdinal } from '@visx/legend';


type ChartData = {
  status: string;
  groupA: number;
  groupB: number;
  groupC: number;
}
type BarGroupHorizontalProps = {
  data: ChartData[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  events?: boolean;
};

type DataGroup = 'groupA' | 'groupB' | 'groupC';

const blue = '#aeeef8';
const green = '#e5fd3d';
const purple = '#9caff6';
const background = '#612efb';
const defaultMargin = { top: 20, right: 50, bottom: 150, left: 100 };

function max<D>(arr: D[], fn: (d: D) => number) {
  return Math.max(...arr.map(fn));
}

function HorizontalBarChart({
  data,
  width,
  height,
  margin = defaultMargin,
  events = false,
}: BarGroupHorizontalProps) {

  const keys = Object.keys(data[0]).filter((d) => d !== 'status') as DataGroup[];
  const getKey = (d: ChartData ) => d.status;

  // scales
  const statusScale = scaleBand({
    domain: ['Unresolved', 'Resolved'],
    padding: 0.2,
  });
  const groupScale = scaleBand({
    domain: keys,
    padding: 0.1,
  });
  const issueScale = scaleLinear<number>({
    domain: [0, max(data, (d) => max(keys, (key) => Number(d[key])))],
  });
  const colorScale = scaleOrdinal<string, string>({
    domain: keys,
    range: [blue, green, purple],
  });

  // bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // update scale output dimensions
  statusScale.rangeRound([0, yMax]);
  groupScale.rangeRound([0, statusScale.bandwidth()]);
  issueScale.rangeRound([0, xMax]);

  return width < 10 ? null : (
    <div>
          <div
          style={{
            position: 'absolute',
            top: margin.top / 2 ,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            fontSize: '14px',
            color: green,
          }}
        >
          <LegendOrdinal scale={colorScale} direction="row" labelMargin="0 15px 0 0" />
        </div>
    <svg width={width} height={height}>
      <rect x={0} y={0} width={width} height={height} fill={background} rx={14} />
      <Group top={margin.top} left={margin.left}>
        <BarGroupHorizontal
          data={data}
          keys={keys}
          width={xMax}
          y0={getKey}
          y0Scale={statusScale}
          y1Scale={groupScale}
          xScale={issueScale}
          color={colorScale}
          >
          {(barGroups) =>
            barGroups.map((barGroup) => (
              <Group
                key={`bar-group-horizontal-${barGroup.index}-${barGroup.y0}`}
                top={barGroup.y0}
                >
                {barGroup.bars.map((bar) => (
                  <Bar
                    key={`${barGroup.index}-${bar.index}-${bar.key}`}
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    fill={bar.color}
                    rx={4}
                    onClick={() => {
                      if (events) alert(`${bar.key} (${bar.value}) - ${JSON.stringify(bar)}`);
                    }}
                  />
                ))}
              </Group>
            ))
          }
        </BarGroupHorizontal>
        <AxisLeft
          scale={statusScale}
          stroke={green}
          tickStroke={green}
          hideAxisLine
          tickLabelProps={{
            fill: green,
            fontSize: 11,
            textAnchor: 'end',
            dy: '0.33em',
          }}
        />
        <AxisBottom
          top={yMax}
          scale={issueScale}
          stroke={green}
          tickStroke={green}
          hideAxisLine
          tickLabelProps={{
            fill: green,
            fontSize: 11,
            textAnchor: 'middle',
          }}
        />

      </Group>
      <Text textAnchor={'start'} dx={(margin.left + margin.right)/2} dy={height*0.9} fill={green} width={xMax} scaleToFit={true} >Issue Count by Age</Text>
      <Text textAnchor={'start'} dx={(margin.left + margin.right)/2} dy={height*0.95} fill={green} width={xMax*0.8} scaleToFit={true} >visx &lt;Shape.BarGroupHorizontal /&gt;</Text>
    </svg>

    </div>
  );
}

interface Config {
  reportingPeriod: string;
  days_a: number;
  days_b: number;
}

interface issueData {
  Resolved: {
    groupA: any[];
    groupB: any[];
    groupC: any[];  
  },
  Unresolved: {
    groupA: any[];
    groupB: any[];
    groupC: any[];  
  }
}

function App() {
  const [data, setData] = useState<issueData>({} as issueData);
  const [config, setConfig] = useState<Config>({} as Config);
  const [exampleData, setExampleData] = useState<ChartData[]>([] as ChartData[]);

  useEffect(() => {
    // resolver function declared in the containing UIKit app is
    // accessible within the Frame component
    if(Object.keys(config).length > 0){
      console.log("invoking getIssues")
      console.log(config)
      invoke("getIssues", { reportingPeriod: config.reportingPeriod, days_a: config.days_a, days_b: config.days_b } ).then(d => setData(d as issueData));
    }
  }, [config]);

  useEffect(() => {
    console.log(data)
    if (Object.keys(data).length > 0) {
      setExampleData(
        [{
          status: 'Resolved',
          groupA: data.Resolved.groupA.length,
          groupB: data.Resolved.groupB.length,
          groupC: data.Resolved.groupC.length,
        },{
          status: 'Unresolved',
          groupA: data.Unresolved.groupA.length,
          groupB: data.Unresolved.groupB.length,
          groupC: data.Unresolved.groupC.length,
        }])
    }
  }, [data]);

  const subscription = events.on('CONFIG_UPDATED', (d) => {
    console.log("CONFIG_UPDATED event");
    if (Object.keys(d).length > 0) {
      console.log("updating config data")
      setConfig(d);
    }
  });

  return (
    <div>
      {Object.keys(exampleData).length > 0 && HorizontalBarChart({ data: exampleData, width: 600, height: 600, margin: defaultMargin, events: false })}
    </div>
  );
}

export default App;
