const react = require('react')
const checkVitality = require('./checks')

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

const renderChecks = ({files, repo}) => {
  // This guy renders the rules. There is probably a better way to do it,
  const boxes = []

  const check = pred => {
    if (pred) {
      boxes.push(good)
    } else {
      boxes.push(bad)
    }
  }

  const readme = pred => {
    if (files.readme) {
      check(pred(files.readme))
    } else {
      boxes.push(ugly)
    }
  }

  check(files.readme)
  readme(x => x.length > 500)

  check(files.license)
  check(files.contributing)

  readme(x => x.sections.install)
  readme(x => x.sections.toc)
  readme(x => x.sections.usage)
  readme(x => x.sections.contribute)
  readme(x => x.sections.license)

  boxes.push(td(nopad, repo.stars))
  boxes.push(td(nopad, repo.issues))

  return boxes
}

const readmeSections = Object.keys(model.files.readme.sections)
      .map(k => th({key: k}, k))

const secondHeader =
      tr({},
         th({className: 'left repo'}, 'Repo Name'),
         th({}, 'README'),
         th({}, '> 500 chars'),
         th({}, 'LICENSE'),
         th({}, 'CONTRIBUTING'),
         readmeSections.concat([th({key: 1}, 'Stars'), th({key: 2}, 'Open Issues')]))

const repoStatus = ({files, repo}, index) =>
      tr({key: repo.name + index, className: 0 === index % 2 ? 'even' : 'odd'},
         td({className: 'left repo-name'},
            a({href: repo.org.url, className: 'name-org'}, repo.org.name),
            span({className: 'separator'}, '/'),
            a({href: repo.url, className: 'name-repo'}, repo.name)),
         renderChecks({files, repo}))

const repoMatrix = state => {
  const sections = Object.keys(model.files.readme.sections).length

  return table({
    className: 'stripe order-column compact cell-border dataTable',
    id: 'matrix'},
               thead({},
                     tr({},
                        th({className: 'begin'}, 'Repository'),
                        th({className: 'left readme', colSpan: 2}, 'README.md'),
                        th({className: 'left files', colSpan: 2}, 'Files'),
                        th({className: 'left sections', colSpan: sections},
                           'Sections'),
                        th({className: 'left github', colSpan: 2}, 'GitHub')),
                     secondHeader),
               tbody({}, state.map(repoStatus)))
}

module.exports = {
  main: repoMatrix,
  model
}
