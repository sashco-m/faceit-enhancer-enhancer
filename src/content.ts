import { getUserStatsResponse } from "./background";
import { getUsernameFromPlayer, getPlayersFromRoster, buildStatsTable, fetchWrapper, getUserNodeFromPlayer, userNameToUserNode } from "./helpers";

const waitForRosterLoad = () => {
    var timer = setInterval (pollDOMForRoster, 500);

    function pollDOMForRoster () {
        console.log('searching...')

        if (document.getElementById('parasite-container')?.shadowRoot) {
            // stop polling page
            clearInterval (timer);
            // first find the shadowroot
            const shadowRoot = document.getElementById('parasite-container')?.shadowRoot || null;
            if(!shadowRoot){
                console.log('error selecting shadow dom')
                // set the poll 
                timer = setInterval (pollDOMForRoster, 500);
                return
            }
            // 'roster1' and 'roster2' are convenient names
            let roster1 = getPlayersFromRoster("[name='roster1']", shadowRoot)
            let roster2 = getPlayersFromRoster("[name='roster2']", shadowRoot)
            if(!roster1 || !roster2){
                // set the poll 
                timer = setInterval (pollDOMForRoster, 500);
                console.log('error getting roster')
                return
            }

            //useIdFromMatchPage([...roster1, ...roster2])
            useIdFromMatchApi([...roster1, ...roster2]) 
        }
    }
}

waitForRosterLoad()

// implementation #1
// we scrape the roster for userId's, and use those Id's to get player_id's
// the playerId's are used to then get stats which are inserted back into the page
const useIdFromMatchPage = (roster:Array<ChildNode>) => {
    for(let node of roster){
        // set a loading message
        const loadMsg = document.createElement('h5')
        loadMsg.textContent = 'loading...'
        node.appendChild(loadMsg)
        // we need to consider the extra div added from whether they are in a party or not
        const userName = getUsernameFromPlayer(node);
        (async () => {
            const response = await chrome.runtime.sendMessage({type: "getUserStats", userName}) as getUserStatsResponse
            // remove loadMsg
            node.removeChild(loadMsg)
            if(!response){
                const errMsg = document.createElement('h5')
                errMsg.textContent = `Error fetching stats for: ${userName}`
                node.appendChild(errMsg)
                return
            }

            node.appendChild(buildStatsTable(response)) 
        })();

    }
}

// implementation #2
const useIdFromMatchApi = (roster:Array<ChildNode>) => {
    // the idea is to use the match ID from the URL to get all 
    // player_id's in the lobby
    // then we loop over each player, and determine where to insert this data
    // using the nameToNode map
    // this cuts down on the number of calls (10 -> 1)
    const match_id = window.location.pathname.split('/').slice(-1);

    (async () => {
        const rosterData = await chrome.runtime.sendMessage({type: "getMatchUsers", match_id})
        let nameToNode = userNameToUserNode(roster)
        console.log(rosterData)
        console.log(nameToNode)

        for(let player of rosterData){
            // find the player by nickname
            let playerNode = nameToNode.get(player.nickname)
            if(!playerNode) continue
            // set a loading message
            const loadMsg = document.createElement('h5')
            loadMsg.textContent = 'loading...'
            playerNode.appendChild(loadMsg);

            (async () => {
                const response = await chrome.runtime.sendMessage({type: "getUserStatsNew", player_id: player.player_id}) as getUserStatsResponse
                // remove loadMsg
                playerNode.removeChild(loadMsg)
                if(!response){
                    const errMsg = document.createElement('h5')
                    errMsg.textContent = `Error fetching stats for: ${player.nickname}`
                    playerNode.appendChild(errMsg)
                    return
                }
    
                playerNode.appendChild(buildStatsTable(response)) 
            })();
    
        }
    })()
}