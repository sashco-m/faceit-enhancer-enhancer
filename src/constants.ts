// this is designed to be a client-facing key
export const client_key = '1ff02912-43ac-438f-a12b-0be7e76d45b9'
export const base_url = new URL('https://open.faceit.com')

// consider if it's worth interfacing directly with the faceit backend
// curl -H "Authorization: Bearer user_token" https://api.faceit.com/stats/v1/stats/time/users/player_id/games/csgo?size=1 
// it would make a lot fewer requests but require incredibly complicated parsing function -> maybe not
// export const old_base_url = new URL('https://api.faceit.com')
// export const user_token = localStorage.getItem('token')
// this can be called once the page loads

export const extension_name = 'faceit-enhancer-enhancer'

type items = {
    [key:string]:any
}

// add more in future
// index in display array (js isn't happy with bit strings)
export const SHOW_MATCHES = 0
export const SHOW_KDR = 1
export const SHOW_KPR = 2
export const SHOW_HSP = 3
export const SHOW_BEST_MAP = 4
export const SHOW_WR = 5
// add any default user settings
export const default_settings:items = {
    'numMatches':5,
    'display': [true, true, true, true, true, true]
}