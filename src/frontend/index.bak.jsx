import React, { useEffect, useState } from 'react';
import ForgeReconciler, { BarChart, Box, Button, Frame, Heading, Inline, Label, PieChart, Select, Stack, useProductContext, xcss } from '@forge/react';
import { events, invoke } from '@forge/bridge';
import { MONTH_PICKER } from './data';

/* limits on issue age for the report (in days) 
   report will show issues resolved under 
    - PERIOD_A days, 
    - between PERIOD_A and PERIOD_B days, and 
    - over PERIOD_B days. */

const PERIOD_A = 2;
const PERIOD_B = 4;

const BottomPaddedBox = ({ children }) => (
  <Box paddingBlockEnd="space.400">{children}</Box>
);

const MainBox = ({ children }) => (
  <Box xcss={{height: '100%'}} paddingInlineEnd="space.400">{children}</Box>
);

const App = () => {
  const [config, setConfig] = useState(null);
  const [reportingPeriod, setReportingPeriod] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [month, setMonth] = useState(null);

  const context = useProductContext();

  useEffect(() => {
    invoke('getConfig').then(setConfig);
  }, []); 

  useEffect(() => {
    console.log(reportingPeriod)
    if(reportingPeriod !== null) {
      invoke('setConfig', { reportingPeriod, days_a: PERIOD_A, days_b: PERIOD_B }).then(setConfig);
    }
  }, [reportingPeriod]); 

  useEffect(() => {
    console.log(config)
    if(config !== null) {
      setMonth(MONTH_PICKER.find(o => o.label === config.reportingPeriod.split("-")[0]).options.find(p => p.value === config.reportingPeriod)); 
      invoke('getIssues').then(setGroupData);
      events.emit('CONFIG_UPDATED', { config });
    }
  }, [config]); 

  function atlassianComponentsReport() {
    return (
      <>
      <BottomPaddedBox>
      <Heading as="h2">{month ? month.label : 'Loading...' }</Heading>
      </BottomPaddedBox>
      <BottomPaddedBox>
        <Inline spread='space-between'>
          <PieChart
              title="Resolved Issues"
              subtitle="Count of resolved issues, by age in buisness days"
              data={[
                ['group_a', 'Under ' + PERIOD_A + ' days', groupData.Resolved.groupA.length],
                ['group_b',PERIOD_A + ' - ' + PERIOD_B + ' days', groupData.Resolved.groupB.length],
                ['group_c', 'over ' + PERIOD_B + ' or more days', groupData.Resolved.groupC.length],
              ]}
            colorAccessor={0} // position 0 in item array
            labelAccessor={1} // position 1 in item array
            valueAccessor={2} // position 2 in item array
          /> 
          <BarChart 
            title="Unresolved Issues"
            subtitle="Count of unresolved issues, by age in buisness days"
            width='600px'
            data={[
              ['Under ' + PERIOD_A + ' days', groupData.Unresolved.groupA.length],
              [PERIOD_A + ' - ' + PERIOD_B + ' days', groupData.Unresolved.groupB.length],
              [PERIOD_B + ' or more days', groupData.Unresolved.groupC.length],
            ]}
            xAccessor={0}
            yAccessor={1} 
          />
      </Inline>
      </BottomPaddedBox>
      </>
    )
  }

  return (
    <>  
        <BottomPaddedBox>
          <Heading as="h1">Resolution time report</Heading>
          <Heading as="h3">Project: {context ? context.extension.project.key : 'Loading...'}</Heading>
        </BottomPaddedBox>
        <BottomPaddedBox>
          <Label labelFor="month-picker">Select reporting period</Label>
          <Select 
            onChange={(data) => setReportingPeriod(data.value)}
            id="month-picker" 
            options={MONTH_PICKER} 
            defaultValue={month}
            placeholder="select a month"/>  
        </BottomPaddedBox>
        {groupData && 
          <MainBox>
            <Stack>
              {atlassianComponentsReport()}
              <Frame resource='frame-report' />
            </Stack>
          </MainBox>
        }
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
