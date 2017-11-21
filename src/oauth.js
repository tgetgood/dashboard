'use strict'

const http = require('axios')

const clientID = '641b3a2ca0d1f03efe5d'

const rando = () => Math.floor(Math.random() * 1e20)

// Slightly ghetto, but hard to guess.
const state = () => '' + rando() + 'v' + rando()

const oauthKey = 'maintainer-github-auth'

// let githubToken = window.localStorage.getItem(oauthKey)

// const query = require('query-string').parse(window.location.search)

// const authenticate = () => new Promise((resolve, reject) => {
//   if (githubToken) {
//     resolve(githubToken)
//   } else if (query.code) {
//     if (query.state === window.localStorage.getItem('state')) {
//       return http({
//         method: 'post',
//         headers: {'Accept': 'application/json'},
//         url: 'https://github.com/login/oauth/access_token',
//         params: {
//           client_id: clientID,
//           client_secret: '',
//           code: query.code
//         }})
//     } else {
//       reject(new Error('Possible CSRF attack. Denied.'))
//     }
//   } else {
//     const theState = state()
//     window.localStorage.setItem('state', theState)
//     window.location = `https://github.com/login/oauth/authorize?client_id=${clientID}&state=${theState}`
//   }
// })

module.exports = {
  // authenticate,
  dummyAuthenticate: () => new Promise((resolve, reject) => resolve(require('../dummyAuth')))
}
