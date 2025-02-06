
import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

export const WORK_DAY = 28800000; // 8 hours

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
    console.log(response)
    return(response)
  }
}

const resolver = new Resolver();

resolver.define('getIssues', async (req) => {
  const first = new Date(req.payload.reportingPeriod.split("-")[0], req.payload.reportingPeriod.split("-")[1], 1)
  const last = new Date(req.payload.reportingPeriod.split("-")[0], Number(req.payload.reportingPeriod.split("-")[1]) + 1, 0)

  const data = await getIssues(req.context.extension.project.key, first, last);
  const groupData = getGroupData(data, req.payload.days_a, req.payload.days_b)
  return groupData;
  
});

resolver.define('getText', (req) => {
  console.log(req);
  return 'Hello Brussels!';
});

export const handler = resolver.getDefinitions();
