import { getUserStatsResponse } from "./background";
import { getPlayersFromRoster, buildStatsTable, userNameToUserNode, buildLoadingMessage, hasBeenModified } from "./helpers";

/* Listens to the background script for when to start looking for
 * the roster.
 * There is a problem where multiple history state changes are being pushed per navigate,
 * so our listener must be idempotent.
 * For now, we just check if we've inserted anything before trying to insert the loading icon.
 * I'd like a better solution but this works, plus any extra API calls would be cached.
*/
chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
        waitForRosterLoad()
    }
)

const waitForRosterLoad = () => {
    
    function pollDOMForRoster () {
        console.log('searching...')

        // stop polling page
        clearInterval (timer);
        // first find the shadowroot
        const shadowRoot = document.getElementById('parasite-container')?.shadowRoot || null;
        if(!shadowRoot){
            console.log('error selecting shadow dom')
            // set the poll 
            pollIfNotTimedOut() 
            return
        }
        // 'roster1' and 'roster2' are convenient names
        let roster1 = getPlayersFromRoster("[name='roster1']", shadowRoot)
        let roster2 = getPlayersFromRoster("[name='roster2']", shadowRoot)
        if(!roster1 || !roster2){
            // set the poll 
            pollIfNotTimedOut() 
            console.log('error getting roster')
            return
        }
        // might as well clear the timeout
        clearTimeout(timeout)
        useIdFromMatchApi([...roster1, ...roster2]) 
    }

    // timers for roster load
    let timer = setInterval (pollDOMForRoster, 500)
    let timedOut = false
    const timeout = setTimeout(() => timedOut = true, 15000)
    const pollIfNotTimedOut = () => {
        if(timedOut){
            console.log('timed out') 
            return
        }
        timer = setTimeout(pollDOMForRoster, 500)
    }
}

// implementation #2
const useIdFromMatchApi = (roster:ChildNode[]) => {
    // the idea is to use the match ID from the URL to get all 
    // player_id's in the lobby
    // then we loop over each player, and determine where to insert this data
    // using the nameToNode map
    // this cuts down on the number of calls (10 -> 1)
    const match_id = window.location.pathname.split('/').slice(-1);

    (async () => {
        const rosterData = await chrome.runtime.sendMessage({type: "getMatchUsers", match_id})
        let nameToNode = userNameToUserNode(roster)

        for(let player of rosterData){
            // find the player by nickname
            let playerNode = nameToNode.get(player.nickname)
            if(!playerNode) continue

            // make sure it hasn't already been set
            if(playerNode.parentNode && hasBeenModified(playerNode.parentNode)) return

            // set a loading message
            const loadMsg = buildLoadingMessage()
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