import { getUserStatsResponse } from "./background"
import { base_url, client_key, extension_name } from "./constants"

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

export const getUserNodeFromPlayer = (playerNode: ChildNode) => {
    let nodeIter = document.createNodeIterator(playerNode, NodeFilter.SHOW_TEXT, {
        acceptNode(node){
            if(node.parentNode?.nodeName!= 'DIV') // Only usernames are under div's
                return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
        },
    })
   
    // return the first one
    return nodeIter.nextNode()
}

export const userNameToUserNode = (roster:any):Map<string,Node> => {
    let nameToNode = new Map<string, Node>() 
    for(let node of roster){
        let userNode = getUserNodeFromPlayer(node)
        let userName = userNode?.textContent
        if(!userName || !userNode) continue
        // insert it somewhere in the tree above the username (subject to change)
        let player = userNode.parentNode?.parentNode?.parentNode?.parentNode?.parentNode
        if(!player) continue
        nameToNode.set(userName, player)
    }
    return nameToNode
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
        },
        cache: 'force-cache',
    })
}

export const hasBeenModified = (node:ParentNode):boolean => {
    return node.querySelector(`.${extension_name}`) != null
}

export const buildLoadingMessage = ():HTMLHeadingElement => {
    const loadMsg = document.createElement('h5')
    loadMsg.textContent = 'loading...'
    loadMsg.classList.add(extension_name)
    return loadMsg
}

export const buildErrorMessage = (msg:string) => {
    const errMsg = document.createElement('h5')
    errMsg.textContent = msg 
    errMsg.classList.add(extension_name)
    return errMsg
}

export const buildStatsTable = (userStats: getUserStatsResponse):HTMLTableElement => {
    let table = document.createElement('table')
    table.classList.add(extension_name)

    let headers = document.createElement('tr')
    let kdrHeader = document.createElement('th')
    kdrHeader.innerHTML = "kdr"
    let kprHeader = document.createElement('th')
    kprHeader.innerHTML = "kpr"
    let hspHeader = document.createElement('th')
    hspHeader.innerHTML = "hsp"
    let wrHeader = document.createElement('th')
    wrHeader.innerHTML = "wr"
    headers.append(kdrHeader, kprHeader, hspHeader, wrHeader)
    

    let values = document.createElement('tr')
    let hspLine = document.createElement('td')
    hspLine.style.paddingRight = '8px'
    hspLine.innerHTML=`${(userStats.hsp/userStats.matchesCounted).toFixed(0)}%`
    let wrLine = document.createElement('td')
    wrLine.style.paddingRight = '8px'
    wrLine.innerHTML=`${userStats.wr}/${userStats.matchesCounted}`
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

export const debounce = (f:Function, timeout = 500) => {
    let timer:NodeJS.Timeout
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { f.apply(this, args); }, timeout);
    }
}

/* Takes a function, and applies arguments as args + settings
 * Probably could be made nicer with a higher-order function. 
 * Can't figure out how to not make it ugly though with .then/.catch
*/
export const withSettings = async (f:Function, args:any[], settings:string[]) => {
    return chrome.storage.local.get(settings)
    .then((result) => {
        let values:any[] = []
        for(let setting of settings){
            values.push(result[setting])
        }
        return f.apply(this,[...args, ...values])
    }).catch((err)=>{
        console.log('(withSettings) error getting storage: '+err)
    })
}
