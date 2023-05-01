<script setup lang="ts">
import { ref, watch } from 'vue'
import { debounce } from '../../helpers'

// state variables
const numMatches = ref(0)
const isLoading = ref(true)
const isError = ref(false)

// getting the current setting from background
chrome.storage.local.get(["numMatches"])
.then((result) => {
    numMatches.value = result["numMatches"]
    isLoading.value = false
    isError.value = false
}).catch((err)=>{
    console.log('error getting storage: '+err)
    isLoading.value = false
    isError.value = true
})

// debounce the updates
const debouncedUpdateMatches = debounce((newNumMatches:number)=>{
    chrome.storage.local.set({"numMatches":newNumMatches})
})

// watch for changes in setting
watch(numMatches, (numMatches, prevNumMatches) => {
    debouncedUpdateMatches(numMatches)
})
</script>

<template>
    <div v-if="isLoading">
        <h5>Loading...</h5>
    </div>
    <div v-else-if="isError">
        <h5>Error getting settings from storage</h5>
    </div>
    <div v-else>
        <div class="slidecontainer">
            <label for="matches">Past {{ numMatches }} Matches:</label>
            <input v-model="numMatches" type="range" min="1" max="20" class="slider" id="matches">
        </div>
    </div>
</template>

<style scoped>
.slidecontainer{
    display:flex;
}
label{
    white-space: nowrap;
    margin-right:1em;
}
h5{
    white-space: nowrap;
}
</style>