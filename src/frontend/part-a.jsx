import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Select } from '@forge/react';
import { invoke } from '@forge/bridge';
import { MONTH_PICKER } from './data';


const App = () => {
  const [issues, setIssues] = useState(null);
  const [reportingPeriod, setReportingPeriod] = useState(null);

  useEffect(() => {
    console.log(reportingPeriod)
    if(reportingPeriod) {
      const first = new Date(reportingPeriod.split("-")[0], reportingPeriod.split("-")[1], 1)
      const last = new Date(reportingPeriod.split("-")[0], Number(reportingPeriod.split("-")[1]) + 1, 0)
      invoke('getIssues', { start: first, end: last }).then(setIssues);
    }
  }, [reportingPeriod]); 

  useEffect(() => {
    console.log(issues)
  }, [issues]); 


  return (
    <>
      <Select 
            onChange={(data) => setReportingPeriod(data.value)}
            id="month-picker" 
            options={MONTH_PICKER} 
            placeholder="select a month"/>    
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
