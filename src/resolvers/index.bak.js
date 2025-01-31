
import Resolver from '@forge/resolver';
import api, { route, storage } from '@forge/api';

export const WORK_DAY = 28800000; // 8 hours

const getListKeyFromContext = (context) => {
  const { localId: id } = context;
  return id.split('/')[id.split('/').length - 1];
}

const getConfig = async(key) => {
  return await storage.get(key) || []
}

const setConfig = async(key, reportingPeriod, days_a, days_b) => {
    const newConfig = {
      reportingPeriod: reportingPeriod,
      reportingGroups: {
        days_a: days_a,
        days_b: days_b
      }
    }
    await storage.set(key, newConfig)
    return newConfig;
}

const jiraDate = (d) => {
  const date = new Date(d)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const getGroupData = (d, days_a, days_b) => {
  /*  sort the API into groups based on whether it's Resolved or Unresolved, the length of 
      time it took to resolve (or how long it's been open) */
  let issueData = {
    Resolved: {
      groupA: [],
      groupB: [],
      groupC: []
    },
    Unresolved: {
      groupA: [],
      groupB: [],
      groupC: []
    }
  }
  if(d){
    d.issues.forEach(issue => {
      let elapsed = null;
      if (issue.fields.resolutiondate !== null) {
        elapsed = Number(issue.fields.customfield_10030.completedCycles[0].elapsedTime.millis)                
        if (elapsed < days_a*WORK_DAY) {
          issueData.Resolved.groupA.push(issue);
        } else if (elapsed < days_b*WORK_DAY) {
          issueData.Resolved.groupB.push(issue);
        } else {
          issueData.Resolved.groupC.push(issue);
        }
      }
      else {
        elapsed = Number(issue.fields.customfield_10030.ongoingCycle.elapsedTime.millis)
        if (elapsed < days_a*WORK_DAY) {
          issueData.Unresolved.groupA.push(issue);
        } else if (elapsed < days_b*WORK_DAY) {
          issueData.Unresolved.groupB.push(issue);
        } else {
          issueData.Unresolved.groupC.push(issue);
        }
      }
  })
  return issueData  
  }
}

const getIssues = async(key, start, end) => {
  const fields = 'created, creator, assignee, resolutiondate, customfield_10030';
  const jql = `project = ${key} AND created >= ${jiraDate(start)} AND created <= ${jiraDate(end)}`;
  
  const response = await api.asUser().requestJira(route`/rest/api/3/search/jql?jql=${jql}&fields=${fields}`, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if(response.status === 200) {
    let data = await response.json();
    return(data);
  } else 
  {  
    console.log("Response:")
    console.log(response)
    return(response)
  }
}

const resolver = new Resolver();

resolver.define('getConfig', async (req) => {
  const data = await getConfig(getListKeyFromContext(req.context));
  return data;
})

resolver.define('setConfig', async (req) => {
  const data = await setConfig(getListKeyFromContext(req.context), req.payload.reportingPeriod, req.payload.days_a, req.payload.days_b);
  return data;
})

resolver.define('getIssues', async (req) => {
  const config = await getConfig(getListKeyFromContext(req.context));

  const first = new Date(config.reportingPeriod.split("-")[0], config.reportingPeriod.split("-")[1], 1)
  const last = new Date(config.reportingPeriod.split("-")[0], Number(config.reportingPeriod.split("-")[1]) + 1, 0)

  const data = await getIssues(req.context.extension.project.key, first, last);
  const groupData = getGroupData(data, config.reportingGroups.days_a, config.reportingGroups.days_b)
  return groupData;
});

export const handler = resolver.getDefinitions();
