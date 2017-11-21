const reactDOM = require('react-dom')
const react = require('react')
const view = require('./view')

const config = {
  repos: [
    ['tgetgood', 'whodunnit'],
    ['mntnr', 'name-your-contributors'],
    ['tgetgood', 'dashboard']
  ],
  orgs: ['mntnr', 'adventure-js']
}

const query = require('./query').main(config)

reactDOM.render(
  react.createElement(view.RepoMatrix, {query}, null),
  document.getElementById('react-root'))
