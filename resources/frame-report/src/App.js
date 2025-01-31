import React, { useEffect, useState } from "react";
import { invoke, events } from "@forge/bridge";
import { RadialBarChart, RadialBar, Tooltip, Legend } from 'recharts';

function App() {
  const [data, setData] = useState(null);
  const [radialData, setRadialData] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // resolver function declared in the containing UIKit app is
    // accessible within the Frame component
    if(config){
      console.log("invoking getIssues")
      console.log(config)

      invoke("getIssues", { reportingPeriod: config.reportingPeriod , days_a: config.days_a, days_b: config.days_b } ).then(setData);
    }
  }, [config]);

  useEffect(() => {
    console.log(data)
    formatData();
  }, [data]);


  const subscription = events.on('CONFIG_UPDATED', (data) => {
    console.log("CONFIG_UPDATED event");
    if (data) {
      setConfig(data);
    }
  });


  function formatData() {
    if(data !== null && config !== null) {
      setRadialData([
        {name: 'under ' + config.days_a + ' days', value: data.Resolved.groupA.length, fill: "#8dd1e1", },
        {name: config.days_a + ' to ' + config.days_b + ' days', value: data.Resolved.groupB.length, fill: "#82ca9d", },
        {name: 'over ' + config.days_b + ' days', value: data.Resolved.groupC.length, fill: "#ffc658", },
      ])
    }
  }

  return (
    <div
      style={{
        padding: "1em",
        border: "1px solid #ccc",
        borderRadius: "4px",
        margin: "1em 0",
      }}
    >
      <p>[Frame] Recharts.org example</p>
      <p>{data ? "RadialBarChart - https://recharts.org/en-US/api/RadialBarChart" : "Please select a reporting period..."} </p>
      <RadialBarChart 
        width={500} 
        height={200} 
        innerRadius="10%" 
        outerRadius="80%" 
        data={radialData} 
        startAngle={180} 
        endAngle={0}
      >
        <RadialBar minAngle={15} label={{ fill: '#666', position: 'insideStart' }} background clockWise={true} dataKey='value' />
        <Legend iconSize={10} width={120} height={140} layout='vertical' verticalAlign='middle' align="right" />
        <Tooltip />
      </RadialBarChart>
    </div>
  );
}

export default App;
