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

const model = {
  files: {
    readme: {
      sections: {
        install: {},
        toc: {},
        usage: {},
        contribute: {},
        license: {}
      },
      length: 200
    },
    license: true,
    contributing: false
  },
  repo: {
    org: {name: 'test-org', url: ''},
    name: 'test-repo',
    url: '',
    private: true,
    stars: 432,
    issues: 3,
    prs: 1
  }
}

const nopad = {className: 'no-padding'}

const good = td(nopad,
                div({className: 'success'},
                    i({className: 'mdi mdi-checkbox-blank-circle-outline'})))

const bad = td(nopad,
               div({className: 'failure'},
                   i({className: 'mdi mdi-checkbox-blank-circle'})))

const ugly = td(nopad,
                div({className: 'na'},
                    i({className: 'mdi'}, 'n/a')))

// Overly basic check
const containsSection = (text, section) => text.indexOf(section) >= 0

const renderChecks = (login, r, result) => {
  // This guy renders the rules. There is probably a better way to do it,
  const boxes = []

  if (Object.keys(result).length === 0) {
    return boxes
  } else if (!result.repository) {
    return td({}, div({}, 'repository not found'))
  }

  const repo = result.repository
  const readme = repo.object

  const check = pred => {
    if (pred) {
      boxes.push(good)
    } else {
      boxes.push(bad)
    }
  }

  const readmeCheck = pred => {
    if (readme && readme.text) {
      check(pred(readme.text))
    } else {
      boxes.push(ugly)
    }
  }

  check(readme)
  readmeCheck(x => x.length > 500)

  readmeCheck(x => containsSection(x, '## Install'))
  readmeCheck(x => containsSection(x, 'Table of Contents'))
  readmeCheck(x => containsSection(x, '## Usage'))
  readmeCheck(x => containsSection(x, '## Contribute'))
  readmeCheck(x => containsSection(x, '## License'))

  check(repo.licenseInfo)
  check(repo.codeOfConduct.name !== 'None')

  boxes.push(td(nopad, repo.stargazers.totalCount))
  boxes.push(td(nopad, repo.issues.totalCount))

  return boxes
}
const userUrl = login => `https://github.com/${login}`
const repoUrl = (login, repo) => `https://github.com/${login}/${repo}`

const repoStatus = ({login, repo, result}, index) =>
      tr({key: repo + index, className: index === 0 % 2 ? 'even' : 'odd'},
         td({className: 'left repo-name'},
            a({href: userUrl(login), className: 'name-org'}, login),
            span({className: 'separator'}, '/'),
            a({href: repoUrl(login, repo), className: 'name-repo'}, repo)),
            renderChecks(login, repo, result))

/** Linear scan find and replace. Slow, but not used much.
 */
const findAndReplace = (list, {login, repo, result}) => {
  const i = list.findIndex(l => l.login === login && l.repo === repo)
  return list.slice(0, i)
    .concat([{login, repo, result}])
    .concat(list.slice(i + 1, list.length))
}

const reqs = [
  'Read Me',
  '> 500 chars',
  'Install',
  'ToC',
  'Usage',
  'Contribute',
  'License',
  'License Info',
  'Code of Conduct',
  'Stars',
  'Open Issues'
]

const secondHeader =
      tr({},
         th({className: 'left repo'}, 'Repo Name'),
         reqs.map((name, index) => th({key: index}, name)))

class RepoMatrix extends react.Component {
  constructor (props) {
    super(props)
    this.state = {repos: []}
  }
  // All of the promise resolution logic happens here in didMount. This seems
  // like a terrible way to do things. Async components would make life so much
  // less bug prone.
  async componentDidMount () {
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
    const sections = Object.keys(model.files.readme.sections).length

    if (this.state.rateLimit) {
      const rem = this.state.rateLimit.remaining - this.state.rateLimit.cost
      console.log('Quota remaining: ' + rem)
    }
    return table({
      className: 'stripe order-column compact cell-border dataTable',
      id: 'matrix'},
                 thead({},
                       tr({},
                          th({className: 'begin'}, 'Repository'),
                          th({className: 'left readme', colSpan: 2}, 'README.md'),
                          th({className: 'left sections', colSpan: sections},
                             'Sections'),
                          th({className: 'left files', colSpan: 2}, 'Properties'),
                          th({className: 'left github', colSpan: 2}, 'GitHub')),
                       secondHeader),
                 tbody({}, this.state.repos.map(repoStatus)))
  }
}

module.exports = {
  RepoMatrix,
  model
}
