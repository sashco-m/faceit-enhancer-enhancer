import { default_settings } from "./constants";
import { fetchWrapper, getUserStatsFromMatchStats, withSettings } from "./helpers";


/* Listens to onHistoryStateUpdated events, since we can reach the match page
 * via history.pushState().
 * This is how we tell the content script to get busy. 
 * 
*/
chrome.webNavigation.onHistoryStateUpdated.addListener(
    async (details:chrome.webNavigation.WebNavigationTransitionCallbackDetails) => {

      console.log(`history updated: ${details.url}`)

      // matches URLs with /en/csgo/room/{uuid}
      if(!details.url.match('\/en\/csgo\/room\/[0-9a-zA-z\-]*$')) return

      // Send to all tabs, since multiple could have opened the match page
      chrome.tabs.query({}, tabs => {
        for(let tab of tabs){
          if(!tab.id)
            continue

          chrome.tabs.sendMessage(tab.id, {type:'waitForRosterLoad'})
        }
      })
    }
) 

/* Listens to requests from the content scripts.
 * The background script does the heavy lifting.
 *
 * 
*/

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {

  if(request.type === 'getUserStatsNew')
    withSettings(getUserStatsFromPlayerId, "numMatches")
      .then(f => f(request.player_id))
      .then(sendResponse)

  if(request.type === 'getMatchUsers')
    getMatchUsers(request.match_id).then(sendResponse)
  
  // wait for async response
  return true
});

const getMatchUsers = async (match_id:string) => {
  let matchRes = await fetchWrapper(`/data/v4/matches/${match_id}`);
  if(matchRes.status != 200){
      console.log('error finding stats for player')
      return
  }
  let matchData = await matchRes.json()
  return [...matchData.teams.faction1.roster, ...matchData.teams.faction2.roster]
}

export type getUserStatsResponse = {
  kdr: number,
  kpr: number,
  hsp: number,
  wr: number,
  matchesCounted: number,
};

const getUserStatsFromPlayerId = async (player_id:string, numMatches:any):Promise<getUserStatsResponse|undefined>=> {
  // return last n matches
  let matchRes = await fetchWrapper(`/data/v4/players/${player_id}/history`, new Map([
    ['game', 'csgo'],
    ['offset','0'],
    ['limit', numMatches]
  ]))
  if(matchRes.status != 200){
    console.log('error getting player matches')
    return
  }
  let matchData = await matchRes.json()
  // stats we want to track
  let kdr = 0
  let kpr = 0
  let hsp = 0
  let wr = 0
  let matchesCounted = 0
  // for each match, find the stats of the matchId add the stats to our avg
  for(let match of matchData.items){
    let statsRes = await fetchWrapper(`/data/v4/matches/${match.match_id}/stats`)
    if(statsRes.status != 200){
      console.log('error getting player stats for match')
      return
    }
    let statsData = await statsRes.json()
    // find use data and add it to the stats
    let userStats = getUserStatsFromMatchStats(player_id, statsData)
    if(!userStats){
      console.log('error getting user stats')
      return
    }
    kdr += parseFloat(userStats.player_stats["K/D Ratio"])
    kpr += parseFloat(userStats.player_stats["K/R Ratio"])
    hsp += parseFloat(userStats.player_stats["Headshots %"])
    wr += parseFloat(userStats.player_stats.Result)
    matchesCounted++
  }

  return {
    kdr,
    kpr,
    hsp,
    wr,
    matchesCounted
  }
}

/* Storage for local settings.
 * Set once on background initialization
 *
 * 
*/
chrome.storage.local.set(default_settings)
