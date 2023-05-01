<script setup lang="ts">
import { debounce } from '../../helpers'

const debouncedRefresh = debounce(()=>{
    chrome.tabs.query({active:true, currentWindow:true}, tabs => {
        const tabId = tabs[0].id
        if(!tabId) return

        // clear page, then re-scrape
        chrome.tabs.sendMessage(tabId, {type:'clearPage'}).then(res=>{
            chrome.tabs.sendMessage(tabId, {type:'waitForRosterLoad'})
        })
    })
})
</script>

<template>
    <div class="refresh-container">
        <label for="refresh-button">Refreshes the extension:</label>
        <button id="refresh-button" @click="debouncedRefresh">Refresh</button>
    </div>
</template>

<style scoped>
.refresh-container{
    display: flex;
}
label{
    white-space: nowrap;
    margin-right:1em;
}
</style>