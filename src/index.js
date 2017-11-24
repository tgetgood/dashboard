const axios = require('axios')

const reactDOM = require('react-dom')
const react = require('react')

const view = require('./view')
const query = require('./query')

const appData = axios.get('/config.json')
      .then(res => query(res.data))

reactDOM.render(
  react.createElement(view.Root, {appData}, null),
  document.getElementById('react-root'))
