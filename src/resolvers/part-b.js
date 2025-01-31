
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

const groupUserData = (d, days_a, days_b) => {
  let groupedUserData = [];
  if(d){
    d.forEach((user, index) => {
      console.log(user)
      let groupA = [];
      let groupB = [];
      let groupC = [];
      user.issues.forEach(issue => {
        let elapsed = Number(issue.fields.customfield_10030.completedCycles[0].elapsedTime.millis)
        if (elapsed < days_a*WORK_DAY) {
          groupA.push(issue);
        } else if (elapsed < days_b*WORK_DAY) {
          groupB.push(issue);
        } else {
          groupC.push(issue);
        }
      })
      groupedUserData.push(['under ' + days_a + ' days', groupA.length, user.displayName])
      groupedUserData.push([days_a + '-' + days_b + ' days', groupB.length, user.displayName])
      groupedUserData.push(['over ' + days_b + ' days', groupC.length, user.displayName])
    })
  }
  return groupedUserData;
}

const getGroupData = (d, days_a, days_b) => {
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
    },
    ResolvedByUser: [{
      accountId: null,
      displayName: "Unassigned",
      issues: []
    }]
  }
  if(d){
    d.issues.forEach(issue => {
      let elapsed = null;
      if (issue.fields.resolutiondate !== null) {
        elapsed = Number(issue.fields.customfield_10030.completedCycles[0].elapsedTime.millis)        
        if(issue.fields.assignee !== null) {
          let index = issueData.ResolvedByUser.findIndex(x => x.accountId === issue.fields.assignee.accountId)
          if(index === -1) {
            issueData.ResolvedByUser.push({
              accountId: issue.fields.assignee.accountId,
              displayName: issue.fields.assignee.displayName,
              issues: [issue]
            })
          } else {
            issueData.ResolvedByUser[index].issues.push(issue)
          }  
        } else {
          issueData.ResolvedByUser[0].issues.push(issue)
        }
        
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

  console.log("calling getIssues API");
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

resolver.define('getIssues', async (req) => {
  console.log("getIssues");
  console.log(req.payload)
  const data = await getIssues(req.context.extension.project.key, req.payload.start, req.payload.end);
  const groupData = getGroupData(data, req.payload.days_a, req.payload.days_b)
  return groupData;
});

export const handler = resolver.getDefinitions();
