const reactDOM = require('react-dom')
const view = require('./view')

reactDOM.render(
  view.main([view.model, view.model]),
  document.getElementById('react-root')
)
