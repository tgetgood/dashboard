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

const others = [
  'codeOfConduct',
  'licenseInfo'
]

const files = [
  'readme.md',
  'README.md',
  'Readme.md',
  'README.rst',
  'LICENSE',
  'LICENSE.md',
  'CONTRIBUTING.md'
]

const counters = [
  'starGazers',
  'watchers'
]

const openCounters = [
  'pullRequests',
  'issues'
]

const repoQuery = (login, repo) => {
  const root = node('repository', {name: repo, owner: login})
  for (let field of staticFields) {
    root.addChild(node(field))
  }
  for (let field of counters) {
    root.addChild(node(field, {first: 1}).addChild('totalCount'))
  }
  for (let field of openCounters) {
    root.addChild(node(field, {states: ['OPEN'], first: 1})
                  .addChild(node('totalCount')))
  }
  for (let file of files) {
    root.addChild(node('object', {expression: file})
                  .addChild(node('... on Blob')
                            .addChild(node('text'))))
  }
  return root
}

const main = async config => {
  const token = await auth.dummyAuthenticate()

  const qres = await run({
    token,
    query: repoQuery(),
    name: 'dashboard-root',
    verbose: true
  })

  return qres
}

module.exports = {
  main,
  config
}
