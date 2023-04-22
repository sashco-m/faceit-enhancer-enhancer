import { fetchWrapper, getUserStatsFromMatchStats } from "./helpers";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  getUserStats(request.userName).then(sendResponse)
  // wait for async response
  return true
});

export type getUserStatsResponse = {
  kdr: number,
  kpr: number,
  hsp: number,
  lr: number,
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
  // return last n matches
  let matchRes = await fetchWrapper(`/data/v4/players/${playerId}/history`, new Map([
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
  let lr = 0
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
    let userStats = getUserStatsFromMatchStats(playerId, statsData)
    if(!userStats){
      console.log('error getting user stats')
      return
    }
    kdr += parseFloat(userStats.player_stats["K/D Ratio"])
    kpr += parseFloat(userStats.player_stats["K/R Ratio"])
    hsp += parseFloat(userStats.player_stats["Headshots %"])
    lr += parseFloat(userStats.player_stats.Result) // 0 is win, 1 is loss, so this is numLosses
    matchesCounted++
  }

  return {
    kdr,
    kpr,
    hsp,
    lr,
    matchesCounted
  }
}