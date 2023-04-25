import { getUserStatsResponse } from "./background";
import { getPlayersFromRoster, buildStatsTable, userNameToUserNode } from "./helpers";

const waitForRosterLoad = () => {
    let timer = setInterval (pollDOMForRoster, 500)
    let timedOut = false
    let timeout = setTimeout(() => timedOut = true, 15000)

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
    }

    const pollIfNotTimedOut = () => {
        if(timedOut){
            console.log('timed out') 
            return
        }
        timer = setTimeout(pollDOMForRoster, 500)
    }
}

waitForRosterLoad()

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