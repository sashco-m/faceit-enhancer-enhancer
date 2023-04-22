import { getUserStatsResponse } from "./background"
import { base_url, client_key } from "./constants"

export const getPlayersFromRoster = (rosterSelector:string, shadowRoot:ShadowRoot):ChildNode[]|null  => {

    const parties = shadowRoot.querySelector(rosterSelector)?.firstChild?.childNodes
    if(!parties){
        console.log('unable to get parties')
        return null
    }
    // assumption: dom tree is
    //  roster1 or 2
    //      node
    //          parties
    //              players
    //                  rest of nodes
    let playerNodes:Array<ChildNode> = []
    for(let party of parties){
        for(let player of party.childNodes){
            playerNodes.push(player)
        }
    }
    return playerNodes
}

export const getUsernameFromPlayer = (playerNode: ChildNode):string|null|undefined => {
    // the children should correspond to the parties each user is a part of
    // to be safe just DFS it
    // ^^ we could take the risk and specifically select the username
    //  But requires we know exactly which text is the username
    //  so this solution is likely to break
    /*
    return playerNode
        ?.firstChild
        ?.firstChild
        ?.firstChild
        ?.firstChild
        ?.childNodes[1]
        ?.firstChild
        ?.childNodes[1]
        .textContent
    */

    let nodeIter = document.createNodeIterator(playerNode, NodeFilter.SHOW_TEXT, {
        acceptNode(node){
            if(node.parentNode?.nodeName!= 'DIV') // Only usernames are under div's
                return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
        },
    })
   
    // return the first one. For now this is the username
    return nodeIter.nextNode()?.textContent
}

export type userStatsFromMatchStatsResponse = {
    player_stats:{
        'K/D Ratio':string
        'K/R Ratio':string
        'Headshots %':string
        'Result':string
    }
};

export const getUserStatsFromMatchStats = (playerId:string, matchStats:any):userStatsFromMatchStatsResponse|undefined=> {
    let players = [...matchStats.rounds[0].teams[0].players, ...matchStats.rounds[0].teams[1].players]
    //players.push(...matchStats.rounds[0].teams[1].players)
    return players.find((player:any)=>{
        return player.player_id == playerId
    })
}

export const fetchWrapper = async (path:string, searchParams:Map<string, string> = new Map<string,string>()):Promise<Response> => {

    const url = new URL(path, base_url)
    for(let [key,value] of searchParams){
        url.searchParams.append(key, value)
    }
    return await fetch(url, {
        headers:{
            'Authorization':`Bearer ${client_key}`
        }
    })
}

export const buildStatsTable = (userStats: getUserStatsResponse):HTMLTableElement => {
    let table = document.createElement('table')

    let headers = document.createElement('tr')
    let kdrHeader = document.createElement('th')
    kdrHeader.innerHTML = "kdr"
    let kprHeader = document.createElement('th')
    kprHeader.innerHTML = "kpr"
    let hspHeader = document.createElement('th')
    hspHeader.innerHTML = "hsp"
    let wrHeader = document.createElement('th')
    wrHeader.innerHTML = "winrate"
    headers.append(kdrHeader, kprHeader, hspHeader, wrHeader)
    

    let values = document.createElement('tr')
    let hspLine = document.createElement('td')
    hspLine.style.paddingRight = '8px'
    hspLine.innerHTML=`${(userStats.hsp/userStats.matchesCounted).toFixed(2)}%`
    let wrLine = document.createElement('td')
    wrLine.style.paddingRight = '8px'
    wrLine.innerHTML=`${userStats.matchesCounted - userStats.lr}/${userStats.matchesCounted}`
    let kdrLine = document.createElement('td')
    kdrLine.style.paddingRight = '8px'
    kdrLine.innerHTML = (userStats.kdr/userStats.matchesCounted).toFixed(2)
    let kprLine = document.createElement('td')
    kprLine.style.paddingRight = '8px'
    kprLine.innerHTML = (userStats.kpr/userStats.matchesCounted).toFixed(2)
    values.append(kdrLine, kprLine, hspLine, wrLine)

    table.append(headers, values)

    return table
}

