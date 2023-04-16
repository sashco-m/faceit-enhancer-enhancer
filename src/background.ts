import { getUserStatsFromMatchStats } from "./helpers";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  getUserStats(request.userName).then((res)=>{
    sendResponse({kdr:res?.kdr, matchesCounted:res?.matchesCounted})
  })
  // wait for async response
  return true
});
  
const getUserStats = async (userName:string) => {
  console.log('get stats')

  // find playerId (I think we can get player_id from the match page. This may be unecessary)
  let playerRes = await fetch(`https://open.faceit.com/data/v4/players?nickname=${userName}&game=csgo`, {
    headers:{
      'Authorization':'Bearer 1ff02912-43ac-438f-a12b-0be7e76d45b9'
    }
  })
  if(playerRes.status != 200){
    console.log('error finding stats for player')
    console.log(playerRes)
    return
  }
  let playerData = await playerRes.json()
  let playerId = playerData.player_id
  console.log(`player id: ${playerId}`)
  
  // return last 20 matches
  let matchRes = await fetch(`https://open.faceit.com/data/v4/players/${playerId}/history?game=csgo&offset=0&limit=1`, {
    headers:{
      'Authorization':'Bearer 1ff02912-43ac-438f-a12b-0be7e76d45b9'
    }
  })
  if(matchRes.status != 200){
    console.log('error getting player matches')
    console.log(matchRes)
  }

  let matchData = await matchRes.json()
  console.log(matchData)

  let kdr = 0
  let matchesCounted = 0
  // for each match, find the stats of the matchId add the stats to our avg
  for(let match of matchData.items){
    let statsRes = await fetch(`https://open.faceit.com/data/v4/matches/${match.match_id}/stats`, {
      headers:{
        'Authorization':'Bearer 1ff02912-43ac-438f-a12b-0be7e76d45b9'
      }
    })
    if(statsRes.status != 200){
      console.log('error getting player stats for match')
      return
    }
    let statsData = await statsRes.json()
    // find use data and add it to the stats
    let userStats = getUserStatsFromMatchStats(playerId, statsData)
    console.log(userStats)         
    if(!userStats){
      console.log('error getting user stats')
      return
    }
    kdr += userStats["player_stats"]["K/D Ratio"]
    matchesCounted++
  }
  console.log(`kdr: ${kdr}`) 
  console.log(`matches: ${matchesCounted}`) 

  return {
    kdr,
    matchesCounted
  }
}