const react = require('react')
const readmeInfo = require('./query').readmeInfo

/// React helpers

const el = react.createElement
const domfn = tag => (...args) => el.apply(null, [tag].concat(args))

const div = domfn('div')
const span = domfn('span')
const a = domfn('a')
const i = domfn('i')

const h1 = domfn('h1')
const h2 = domfn('h2')
const h3 = domfn('h3')
const h4 = domfn('h4')
const h5 = domfn('h5')
const h6 = domfn('h6')

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
      x => {
        if (!x.readme || !x.readme.text) {
          return null
        } else if (pred(x.readme.text)) {
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
    ['Read Me', x => x.readme != null && x.readme.file != null],
    ['> 500 chars', readme(x => x.length > 500)],
    ['Install', readme(containsSection('## Install'))],
    ['ToC', readme(containsSection('Table of Contents'))],
    ['Usage', readme(containsSection('## Usage'))],
    ['Contribute', readme(containsSection('## Contribute'))],
    ['License', readme(containsSection('## License'))]
  ]],
  ['GitHub', 'github', [
    ['License Info', x => x.repository.licenseInfo != null],
    ['Code of Conduct', x => x.repository.codeOfConduct !== 'None'],
    ['Stars', x => x.repository.stargazers.totalCount],
    ['Open Issues', x => x.repository.issues.totalCount]
  ]]
]

const dashl2 = Array.prototype.concat.apply([], dashRowModel.map(x => x[2]))

const good = span({className: 'success'},
                  i({className: 'mdi mdi-checkbox-blank-circle-outline'}, '✓'))

const bad = span({className: 'failure'},
                 i({className: 'mdi mdi-checkbox-blank-circle'}, '✗'))

const ugly = span({className: 'na'}, '')

const interpretStatus = x => {
  if (x == null) {
    return ugly
  } else if (x === true) {
    return good
  } else if (x === false) {
    return bad
  } else {
    return span({}, x)
  }
}

const renderChecks = result => {
  if (Object.keys(result).length === 0) {
    return []
  } else if (!result.repository) {
    return [div({}, 'repository not found')]
  }
  return dashl2.map(x => x[1](result))
    .map(interpretStatus)
}

const pushE = new window.CustomEvent('pushstate')

const pushState = function () {
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
            h6({}, login + '/' + repo)),
         renderChecks(result)
         .map((r, i) =>
              td({className: 'no-padding', key: login + repo + index + ':' + i}, r)))

const repoMatrix = state =>
      table({
        className: 'u-full-width',
        id: 'matrix'},
            thead({},
                  tr({},
                     th({}, 'Repository'),
                     dashRowModel.map(([name, key, rest]) =>
                              th({
                                className: `${key}`,
                                colSpan: rest.length,
                                key: key
                              }, name))),
                  tr({},
                     th({}, 'Repo Name'),
                     dashl2.map(([name, pred]) =>
                                th({key: name}, name)))),
                 tbody({}, state.repos.map(repoStatus)))

/// ----------------------------------------------------------------------
// repo page
/// ----------------------------------------------------------------------

const mklink = (href, title) => a({href: href, className: 'large-link'}, title || href)

const errNone = span({}, span({}, 'None '), bad)

const notNone = x => x === 'None' ? errNone : x

const healthModel = [
  ['Public Repo?', x => !x.isPrivate],
  ['Home Page', x => x.homepageUrl ? mklink(x.homepageUrl) : errNone],
  ['License', x => x.licenseInfo ? x.licenseInfo.name : errNone],
  ['Code of Conduct', x => notNone(x.codeOfConduct.name)],
  ['Last Commit', x => new Date(x.pushedAt).toLocaleDateString()]
]

const statsModel = [
  ['Watchers', x => x.watchers.totalCount],
  ['Stars', x => x.stargazers.totalCount],
  ['Forks', x => x.forks.totalCount],
  ['Open Issues', x => x.issues.totalCount],
  ['Open PRs', x => x.pullRequests.totalCount]
]

const readmeModel = [
  ['Read Me', 'readme', [
    ['File Name', x => x.readme.file],
    ['Lines', x => x.readme.text.split('\n').length]
  ]],
  ['Sections', 'sections', [
    ['ToC', readme(containsSection('Table of Contents'))],
    ['Install', readme(containsSection('## Install'))],
    ['Usage', readme(containsSection('## Usage'))],
    ['Contribute', readme(containsSection('## Contribute'))],
    ['License', readme(containsSection('## License'))]
  ]]
]

const statusBody = (format, repo) =>
      ([name, pred]) =>
      tr({key: name},
         td({}, span({}, name)),
         td({}, format(pred(repo))))

const easyTable = (model, data) =>
      tbody({},
            model.map(statusBody(interpretStatus, data)))

const readmeTable = result => {
  if (!result.readme || result.readme.then) {
    return div({className: 'warning'}, 'No README found')
  }
  return div({className: 'container'},
             readmeModel.map(([cat, c, props]) => {
               return div({className: 'row', key: cat},
                          table({},
                                thead({},
                                      tr({},
                                         th({className: c}, cat))),
                                easyTable(props, result)))
             }))
}

const statsTable = result =>
      table({},
            thead({},
                  tr({},
                     th({className: 'github'}, 'Community'))),
            easyTable(statsModel, result.repository))

const health = result =>
      table({},
            thead({},
                  tr({},
                     th({}, 'Basic Info'))),
            easyTable(healthModel, result.repository))

const header = (login, repo) =>
      h1({className: 'repo-name'},
         a({href: userUrl(login)}, login),
         span({}, ' / '),
         a({href: repoUrl(login, repo)}, repo))

const repoPage = state => {
  if (!state || state.result.then) {
    return h4({}, 'Loading ...')
  } else if (!state.result.repository) {
    return h4({}, 'Repository not found. Is the name correct?')
  }
  const {login, repo, result} = state

  if (result.then) {
    return header(login, repo)
  }

  return div({className: 'container u-full-width'},
             div({className: 'row'},
                 header(login, repo)),
             div({className: 'row'},
                 div({className: 'four columns'},
                     health(result)),
                 div({className: 'four columns'},
                     readmeTable(result)),
                 div({className: 'four columns'},
                     statsTable(result))))
}

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
    const q = await this.props.appData
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
      let readme = await r.readme
      r.readme = readme

      this.setState((prev, props) => {
        return {
          orgs: prev.orgs,
          rateLimit: prev.rateLimit,
          repos: findAndReplace(prev.repos, {
            login,
            repo,
            result: {repository: r.repository, readme}
          })
        }
      })
    }

    for (let {result} of q.orgs) {
      let org = await result
      let ad = await this.props.appData
      let repos = org.organization.repositories.nodes.map(o => {
        return {
          login: o.owner.login,
          repo: o.name,
          result: readmeInfo({
            result: {repository: o},
            login: o.owner.login,
            repo: o.name,
            token: ad.token
          })
        }
      }).map(({result}) => result)

      if (repos.length > 0) {
        this.setState((prev, props) => {
          return {
            orgs: prev.orgs,
            repos: prev.repos.concat(repos),
            rateLimit: org.rateLimit
          }
        })
        repos.map(async ({login, repo, result}) => {
          let readme = null
          try {
            readme = await result.readme
          } catch (e) {}

          this.setState((prev, props) => {
            return {
              orgs: prev.orgs,
              rateLimit: prev.rateLimit,
              repos: findAndReplace(prev.repos, {
                login,
                repo,
                result: {
                  repository: result.repository,
                  readme
                }
              })
            }
          })
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
