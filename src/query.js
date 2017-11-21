'use strict'

const config = {
  'orgs': [
    'adventure-js'
  ],
  'individualRepos': [
    'RichardLitt/maintainer-dashboard',
    'RichardLitt/knowledge'
  ]
}

const auth = require('./oauth')
const node = require('./graphql').queryNode
const run = require('./graphql').executequery

const query = node('viewer').addChild(node('login'))

const staticFields = [
  'pushedAt',
  'homepageUrl',
  'resourcePath'
]

const readmeNames = [
  'readme.md',
  'README.md',
  'Readme.md',
  'README.rst'
]

const counters = [
  'stargazers',
  'watchers'
]

const openCounters = [
  'pullRequests',
  'issues'
]

const license = root =>
      root.addChild(node('licenseInfo').addChild(node('name')))

const codeOfConduct = root =>
      root.addChild(node('codeOfConduct').addChild(node('name')))

const readme = root =>
      root.addChild(node('object', {expression: 'master:README.md'})
                    .addChild(node('... on Blob')
                              .addChild(node('text'))))

const repoQuery = (login, repo) => {
  let root = node('repository', {name: repo, owner: login})
  for (let field of staticFields) {
    root = root.addChild(node(field))
  }
  for (let field of counters) {
    root = root.addChild(node(field).addChild(node('totalCount')))
  }
  for (let field of openCounters) {
    root = root.addChild(node(field, {states: ['OPEN']})
                         .addChild(node('totalCount')))
  }
  return readme(license(codeOfConduct(root)))
}

const main = async config => {
  const token = await auth.dummyAuthenticate()

  return {
    repos: config.repos.map(([login, repo]) => {
      const result = run({
        token,
        query: repoQuery(login, repo),
        name: `dashboard-root:${login}:${repo}`,
        verbose: false
      })

      return {login, repo, result}
    })
  }
}

module.exports = {
  main,
  config
}
