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
