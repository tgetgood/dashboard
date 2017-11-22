const react = require('react')
const checkVitality = require('./checks')

/// React helpers

const el = react.createElement
const domfn = tag => (...args) => el.apply(null, [tag].concat(args))

const div = domfn('div')
const span = domfn('span')
const a = domfn('a')
const i = domfn('i')

const table = domfn('table')
const thead = domfn('thead')
const tbody = domfn('tbody')
const tr = domfn('tr')
const th = domfn('th')
const td = domfn('td')

// Dummy model
// TODO: Needs to go

const findRow = (list, [login, repo]) =>
  list.find(l => l.login === login && l.repo === repo)

/** Linear scan find and replace. Slow, but not used much.
 */
const findAndReplace = (list, {login, repo, result}) => {
  const i = list.findIndex(l => l.login === login && l.repo === repo)
  return list.slice(0, i)
    .concat([{login, repo, result}])
    .concat(list.slice(i + 1, list.length))
}

/// ----------------------------------------------------------------------
// Dashboard
/// ----------------------------------------------------------------------

const readme = pred =>
      repo => {
        if (!repo || !repo.object) {
          return null
        } else if (pred(repo.object.text)) {
          return true
        } else {
          return false
        }
      }

const containsSection = section => text => text.indexOf(section) >= 0

/// Domain model
// Format: Top level category, class, [(subcategory, predicate)]
const dashRowModel = [
  ['README', 'readme', [
    ['Read Me', x => x.object != null],
    ['> 500 chars', readme(x => x.length > 500)],
    ['Install', readme(containsSection('## Install'))],
    ['ToC', readme(containsSection('Table of Contents'))],
    ['Usage', readme(containsSection('## Usage'))],
    ['Contribute', readme(containsSection('## Contribute'))],
    ['License', readme(containsSection('## License'))]
  ]],
  ['GitHub', 'github', [
    ['License Info', x => x.licenseInfo != null],
    ['Code of Conduct', x => x.codeOfConduct !== 'None'],
    ['Stars', x => x.stargazers.totalCount],
    ['Open Issues', x => x.issues.totalCount]
  ]]
]

const dashl2 = Array.prototype.concat.apply([], dashRowModel.map(x => x[2]))

const good = div({className: 'success'},
                    i({className: 'mdi'}, '✓'))

const bad = div({className: 'failure'},
                   i({className: 'mdi mdi-checkbox-blank-circle'}))

const ugly = div({className: 'na'},
                    i({className: 'mdi'}))

const renderChecks = result => {
  if (Object.keys(result).length === 0) {
    return []
  } else if (!result.repository) {
    return [div({}, 'repository not found')]
  }
  return dashl2.map(x => x[1](result.repository))
    .map(x => {
      if (x == null) {
        return ugly
      } else if (x === true) {
        return good
      } else if (x === false) {
        return bad
      } else {
        return span({}, x)
      }
    })
}

const pushE = new window.CustomEvent('pushstate')

const pushState = function () {
  console.log('push')
  window.history.pushState.apply(window.history, arguments)
  window.dispatchEvent(pushE)
}

const userUrl = login => `https://github.com/${login}`
const repoUrl = (login, repo) => `https://github.com/${login}/${repo}`

const redirect = (login, repo) => e =>
      pushState({}, '', window.location.origin + `?login=${login}&repo=${repo}`)

const repoStatus = ({login, repo, result}, index) =>
      tr({key: repo + index, className: index === 0 % 2 ? 'even' : 'odd'},
         td({className: 'left repo-name', onClick: redirect(login, repo)},
            a({href: userUrl(login), className: 'name-org'}, login),
            span({className: 'separator'}, '/'),
            a({href: repoUrl(login, repo), className: 'name-repo'}, repo)),
         renderChecks(result)
         .map((r, i) =>
              td({className: 'no-padding', key: login + repo + index + ':' + i}, r)))

const repoMatrix = state =>
      table({
        className: 'stripe order-column compact cell-border dataTable',
        id: 'matrix'},
            thead({},
                  tr({},
                     th({className: 'begin'}, 'Repository'),
                     dashRowModel.map(([name, key, rest]) =>
                              th({
                                className: `left ${key}`,
                                colSpan: rest.length,
                                key: key
                              }, name))),
                  tr({},
                     th({className: 'left repo'}, 'Repo Name'),
                     dashl2.map(([name, pred]) => th({key: name}, name)))),
                 tbody({}, state.repos.map(repoStatus)))

/// ----------------------------------------------------------------------
// repo page
/// ----------------------------------------------------------------------

const repoPage = state =>
      div({}, '')

/// ----------------------------------------------------------------------
// Root View
/// ----------------------------------------------------------------------

const qs = require('query-string').parse

class Root extends react.Component {
  constructor (props) {
    super(props)
    this.state = {repos: [], state: 'dash'}
  }
  // All of the promise resolution logic happens here in didMount. This seems
  // like a terrible way to do things. Async components would make life so much
  // less bug prone.
  async componentDidMount () {
    // Routing
    const checkQuery = e => {
      console.log('query')
      const query = qs(window.location.search)
      const newState = (query.login && query.repo)
            ? [query.login, query.repo] : 'dash'

      this.setState((prev, props) => {
        return {
          repos: prev.repos,
          orgs: prev.orgs,
          state: newState
        }
      })
    }
    checkQuery()
    window.addEventListener('pushstate', checkQuery)
    window.addEventListener('popstate', checkQuery)

    // Promise fulfillment
    const q = await this.props.query
    this.setState((prev, props) => q)

    for (let {login, repo, result} of q.repos) {
      let r = await result
      this.setState((prev, props) => {
        return {
          orgs: prev.orgs,
          repos: findAndReplace(prev.repos, {login, repo, result: r}),
          rateLimit: r.rateLimit
        }
      })
    }

    for (let {result} of q.orgs) {
      let org = await result
      let repos = org.organization.repositories.nodes.map(o => {
        return {
          login: o.owner.login,
          repo: o.name,
          result: {repository: o}
        }
      })
      if (repos.length > 0) {
        this.setState((prev, props) => {
          return {
            orgs: prev.orgs,
            repos: prev.repos.concat(repos),
            rateLimit: org.rateLimit
          }
        })
      }
    }
  }

  render () {
    if (this.state.rateLimit) {
      const rem = this.state.rateLimit.remaining - this.state.rateLimit.cost
      console.log('Quota remaining: ' + rem)
    }
    if (this.state.state === 'dash') {
      return repoMatrix(this.state)
    } else {
      return repoPage(findRow(this.state.repos, this.state.state))
    }
  }
}

module.exports = {
  Root
}
