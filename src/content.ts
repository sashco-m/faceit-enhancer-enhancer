import { getUserStatsResponse } from "./background";
import { extension_name } from "./constants";
import { getPlayersFromRoster, buildStatsTable, userNameToUserNode, buildLoadingMessage, hasBeenModified, buildErrorMessage } from "./helpers";

/* Listens to the background script for when to start looking for
 * the roster.
 * There is a problem where multiple history state changes are being pushed per navigate,
 * so our listener must be idempotent.
 * For now, we just check if we've inserted anything before trying to insert the loading icon.
 * I'd like a better solution but this works, plus any extra API calls would be cached.
*/
chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
        if(request.type === 'waitForRosterLoad')
            waitForRosterLoad()
        if(request.type === 'clearPage')
            clearPage()
    }
)

const waitForRosterLoad = () => {
    
    function pollDOMForRoster () {
        console.log('searching...')

        // stop polling page
        clearInterval (timer);
        // 'roster1' and 'roster2' are convenient names
        let roster1 = getPlayersFromRoster("[name='roster1']")
        let roster2 = getPlayersFromRoster("[name='roster2']")
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

const clearPage = () => {
    const shadowRoot = document.getElementById('parasite-container')?.shadowRoot
    if(!shadowRoot){
        console.log('error selecting shadow dom')
        return
    }
    shadowRoot.querySelectorAll(`.${extension_name}`).forEach(el => el.remove())
}

const useIdFromMatchApi = (roster:ChildNode[]) => {
    // Use the match ID from the URL to get all player_id's in the lobby
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
                    const errMsg = buildErrorMessage(`Error fetching stats for: ${player.nickname}`)
                    playerNode.appendChild(errMsg)
                    return
                }
    
                playerNode.appendChild(buildStatsTable(response)) 
            })();
    
        }
    })()
}
