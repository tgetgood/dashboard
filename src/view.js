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

const checkbox = x =>
      td(nopad,
         div({className: 'success'},
             i({className: 'mdi'})))

const renderChecks = ({files, repo}) => {
  console.log(files)
  const bits = [
    files.readme,
    files.readme.length,
    files.license,
    files.contributing
  ]
  const sections = Object.entries(files.readme.sections)
  const github = [repo.stars, repo.issues]

  return bits.concat(sections).concat(github).map(checkbox)
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
      // HACK: random keys won't do.
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
