import { base_url, client_key, extension_name } from "./constants"

export const getPlayersFromRoster = (rosterSelector:string):ChildNode[]|null  => {

    const parties = document.querySelector(rosterSelector)?.firstChild?.childNodes

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
    let nameToNode = new Map<string, HTMLElement>() 
    // want
    // parent -> parent -> parent
    // set flex-direction to column
    // append stats
    for(let node of roster){
        let userNode = getUserNodeFromPlayer(node)
        let userName = userNode?.textContent
        if(!userName || !userNode) continue
        // in-line with name
        let nameLine = userNode.parentNode?.parentNode?.parentNode?.parentNode?.parentNode
        // inside card, beneath name line
        let player = nameLine?.parentNode?.parentNode?.parentElement
        if(!player) continue
        // set player to have flex-direction column
        player.style.flexDirection = 'column'
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

export const buildStatsTable = (userStats: any):HTMLDivElement=> {
    let table = document.createElement('div')
    table.style.display = 'flex'
    table.style.flexWrap = 'wrap'
    table.style.borderTop = '1px solid #303030'
    table.style.justifyContent = 'space-between'
    table.classList.add(extension_name)

    for(let stat in userStats){
        let slot = document.createElement('div')
        slot.style.display = 'flex'
        slot.style.flexDirection = 'column'
        slot.style.padding = '0.5em'
        let title = document.createElement('div')
        let value = document.createElement('div')
        title.innerHTML = `<b>${stat}</b>`
        value.innerHTML = userStats[stat]
        slot.append(title, value)
        table.append(slot)
    }

    return table
}

export const debounce = (f:(...args: any[]) => any, timeout = 500) => {
    let timer:NodeJS.Timeout
    return (...args:any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => { f.apply(this, args); }, timeout);
    }
}

/* Higher-order function which applies the supplied settings as arguments
 * LAST in order of being specified
 * Chain the resulting function with the args you wish to supply
 * Ex. withSettings(foo, 'bar').then()
*/
export const withSettings = async (f:(...args: any[]) => any, ...settings:string[]) => {
    return chrome.storage.local.get(settings)
    .then(settingsMap => {
        return (...args:any[]) => f.apply(this, [
            ...args,
            ...settings.map(setting => settingsMap[setting])
        ])
    })
    // Lesson from the pragmatic programmer
    //  Let it error -> what does catching this do for me?
}
