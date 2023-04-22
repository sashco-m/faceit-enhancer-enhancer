import { fetchWrapper, getUserStatsFromMatchStats } from "./helpers";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.type === 'getUserStats')
    getUserStats(request.userName).then(sendResponse)
  if(request.type === 'getUserStatsNew')
    getUserStatsFromPlayerId(request.player_id).then(sendResponse)
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
  
const getUserStats = async (userName:string):Promise<getUserStatsResponse|undefined> => {
  // find playerId (I think we can get player_id from the match page. This may be unecessary)
  let playerRes = await fetchWrapper('/data/v4/players', new Map([
    ['nickname', userName],
    ['game', 'csgo']
  ]))
  if(playerRes.status != 200){
    console.log('error finding stats for player')
    return
  }
  let playerData = await playerRes.json()
  let playerId = playerData.player_id
  
  return await getUserStatsFromPlayerId(playerId)
}

const getUserStatsFromPlayerId = async (player_id:string):Promise<getUserStatsResponse|undefined>=> {
  // return last n matches
  let matchRes = await fetchWrapper(`/data/v4/players/${player_id}/history`, new Map([
    ['game', 'csgo'],
    ['offset','0'],
    ['limit', '5']
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