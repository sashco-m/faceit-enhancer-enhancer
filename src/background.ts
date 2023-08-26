import { default_settings, SHOW_BEST_MAP, SHOW_HSP, SHOW_KDR, SHOW_KPR, SHOW_MATCHES, SHOW_WR } from "./constants";
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if(request.type === 'getUserStatsNew')
    withSettings(getUserStatsFromPlayerId, "numMatches", "display")
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

const getUserStatsFromPlayerId = async (player_id:string, numMatches:any, display:Array<boolean>):Promise<any>=> {
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
  let matchesTotal = 0
  let bestMap = ''
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
  // find total matches and best map
  let lifetimeRes = await fetchWrapper(`data/v4/players/${player_id}/stats/csgo`)
  if(lifetimeRes.status != 200){
    console.log('error getting lifetime stats')
    return
  }
  let lifetimeData = await lifetimeRes.json()
  matchesTotal = lifetimeData.lifetime.Matches
  let highestWR = 0
  for(let map of lifetimeData.segments){
    if(map.stats['Win Rate %'] > highestWR && map.stats.Matches >= 20){
      highestWR = map.stats['Win Rate %']
      bestMap = map.label
    }
  }

  // display filters what we actually return 
  let res = {}
  if(display[SHOW_MATCHES]) 
    res['matches'] = matchesTotal
  if(display[SHOW_KDR])
    res['kdr'] = (kdr/matchesCounted).toFixed(2)
  if(display[SHOW_KPR])
    res['kpr'] = (kpr/matchesCounted).toFixed(2)
  if(display[SHOW_HSP])
    res['hsp'] = `${(hsp/matchesCounted).toFixed(0)}%`
  if(display[SHOW_BEST_MAP])
    res['best map'] = bestMap
  if(display[SHOW_WR])
    res['wr'] = `${wr}/${matchesCounted}`

  return res
}

/* Storage for local settings.
 * Set once on background initialization
 *
 * 
*/
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set(default_settings)
});
