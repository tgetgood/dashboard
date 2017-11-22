'use strict'

const auth = require('./oauth')
const node = require('./graphql').queryNode
const run = require('./graphql').executequery

const staticFields = [
  'isPrivate',
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
  'forks',
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

const findRepo = (login, repo) =>
  node('repository', {name: repo, owner: login})

const repoQuery = root => {
  root = root.addChild(node('name'))
    .addChild(node('owner').addChild(node('login')))

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

const findOrg = login => node('organization', {login})
const orgRepos = root => root
      .addChild(node('repositories', {first: 20})
                .addChild(repoQuery(node('nodes'))))

const main = async config => {
  const token = await auth.dummyAuthenticate()

  return {
    repos: config.repos.map(([login, repo]) => {
      const result = run({
        token,
        query: repoQuery(findRepo(login, repo)),
        name: `root-repo:${login}:${repo}`,
        verbose: false
      })

      return {login, repo, result}
    }),
    orgs: config.orgs.map(login => {
      const result = run({
        token,
        query: orgRepos(findOrg(login)),
        name: `root-org:${login}`
      })
      return {login, result}
    })
  }
}

module.exports = {
  main
}
