import { getUserStatsResponse } from "./background";
import { getUsernameFromPlayer, getPlayersFromRoster, buildStatsTable } from "./helpers";

const waitForRosterLoad = () => {
    var timer = setInterval (pollDOMForRoster, 500);

    function pollDOMForRoster () {
        console.log('searching...')
        //if (document.getElementsByName('roster1') && document.getElementsByName('roster1')[0]) {
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

            for(let node of [...roster1, ...roster2]){
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
    }
}

//window.addEventListener("load", waitForRosterLoad, false);
waitForRosterLoad()