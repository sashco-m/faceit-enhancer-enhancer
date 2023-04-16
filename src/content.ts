import { getUsernameFromPlayer, getPlayersFromRoster, getUserFromRoster } from "./helpers";

const waitForRosterLoad = (event:any) => {
    var timer = setInterval (pollDOMForRoster, 111);

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
                return
            }
            // 'roster1' and 'roster2' are convenient names
            let roster1 = getPlayersFromRoster("[name='roster1']", shadowRoot)
            let roster2 = getPlayersFromRoster("[name='roster2']", shadowRoot)
            if(!roster1 || !roster2){
                console.log('error getting roster')
                return
            }

            for(let node of [...roster1, ...roster2]){
                // we need to consider the extra div added from whether they are in a party or not
                const userName = getUsernameFromPlayer(node);
                (async () => {
                    console.log(node)
                    const response = await chrome.runtime.sendMessage({type: "getUserStats", userName});
                    console.log(response);
                    let stats = document.createElement('div')
                    stats.innerHTML = response.kdr
                    node.appendChild(stats) 
                })();

            }
            
        }
    }
}

window.addEventListener ("load", waitForRosterLoad, false);