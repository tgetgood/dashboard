'use strict'

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

const readme = (fname, root) =>
      root.addChild(node('object', {expression: `master:${fname}`})
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
  return readme('README.md', license(codeOfConduct(root)))
}

const findOrg = login => node('organization', {login})
const orgRepos = root => root
      .addChild(node('repositories', {first: 20})
                .addChild(repoQuery(node('nodes'))))

const findReadme = ({object, name, moreNames, login, repo, token}) =>
      new Promise((resolve, reject) => {
        if (object && object.text) {
          resolve({file: name, text: object.text})
        } else if (moreNames.length === 0) {
          reject(new Error('No readme found'))
        } else {
          const next = moreNames[0]
          run({
            token,
            name: `${next}: ${login}/${repo}`,
            query: readme(next, findRepo(login, repo))
          }).then(result => {
            resolve(findReadme({
              object: result.repository.object,
              name: next,
              moreNames: moreNames.slice(1, moreNames.length),
              login,
              repo,
              token
            }))
          })
        }
      })

const withReadmeInner = ({login, repo, result, token}) => {
  if (!result.repository) {
    return result
  }
  result.readme = findReadme({
    login,
    repo,
    token,
    object: result.repository.object,
    name: 'README.md',
    moreNames: readmeNames
  })
  return result
}

const withReadme = ({login, repo, result, token}) => {
  if (result.then) {
    return result.then(result => withReadmeInner({login, repo, token, result}))
  } else {
    return withReadmeInner({login, repo, result, token})
  }
}

const readmeInfo = ({login, repo, result, token}) => {
  const res = withReadme({login, repo, result, token})
  return {login, repo, result: res}
}

const main = async config => {
  const token = config.token
  return {
    repos: config.repos.map(([login, repo]) => {
      const result = run({
        token,
        query: repoQuery(findRepo(login, repo)),
        name: `root-repo:${login}:${repo}`,
        verbose: false
      })
      return {login, repo, result}
    }).map(({login, repo, result}) => readmeInfo({login, repo, result, token})),
    orgs: config.orgs.map(login => {
      const result = run({
        token,
        query: orgRepos(findOrg(login)),
        name: `root-org:${login}`
      })
      return {login, result}
    }),
    token
  }
}

module.exports = {
  main,
  readmeInfo
}
