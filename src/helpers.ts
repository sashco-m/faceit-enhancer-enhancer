export const getPlayersFromRoster = (rosterSelector:string, shadowRoot:ShadowRoot) => {

    const parties = shadowRoot.querySelector(rosterSelector)?.firstChild?.childNodes
    if(!parties){
        console.log('unable to get parties')
        return
    }
    // assumption: dom tree is
    //  roster1 or 2
    //      node
    //          parties
    //              players
    //                  rest of nodes
    // may not be true if everyone is soloQ 
    let playerNodes:Array<ChildNode> = []
    for(let party of parties){
        for(let player of party.childNodes){
            playerNodes.push(player)
        }
    }
    return playerNodes
}

export const getUsernameFromPlayer = (playerNode: ChildNode) => {
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
            if(node.parentNode?.nodeName!= 'DIV') // as of right now everything 
                return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
        },
    })
   
    // return the first one. For now this is the username
    return nodeIter.nextNode()?.textContent
}

export const getUserFromRoster = (userNode:ChildNode):string|null => {
    // Deprecated. Replaced by getUsernameFromPlayer
    //convoluted DOM tree
    return userNode.firstChild?.firstChild?.firstChild?.firstChild?.childNodes[1].firstChild?.firstChild?.firstChild?.textContent || null;
}

export const getUserStatsFromMatchStats = (playerId:string, matchStats:any):any => {
    let players = [...matchStats.rounds[0].teams[0].players, ...matchStats.rounds[0].teams[1].players]
    //players.push(...matchStats.rounds[0].teams[1].players)
    return players.find((player:any)=>{
        return player.player_id == playerId
    })
}