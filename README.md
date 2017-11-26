# Maintainer Dashboard

> Maintainer GitHub Dashboard

This is a status board for repositories within a GitHub organization.
It displays build health, and other measures that we care about internally.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Local development](#local-development)
- [Deploy](#deploy)
- [Contribute](#contribute)
- [License](#license)

## Background

This work started with [ipfs/project-repos](https://github.com/ipfs/project-repos). However, as I needed to do some work on it and wanted it to be extendable beyond IPFS, and as I did not have access to the issues for that repository, I have forked it, deleted the history, and made my own copy, here.

## Install

Simply clone this repo and run `npm install`.

## Usage

### Local development

To recompile continuously, and start a development server with hot reloading:

	npm run dev

The app will be hosted at

	http://localhost:8080

To build minified javascript for production:

	npm run build

### Configuration

The tool reads its configuration from `resources/public/config.json` which it
expects to exist. To start go to the `resources/public` directory, copy
`config.json.example` to `config.json`, and change the `token` field to be your
GitHub token. Now you're ready to go.

`repos` is a list of repositories to monitor, given in the form of
`[login, repoName]` pairs. `orgs` is a list of organisation names each of which
will be monitored.

### Token

You need a GitHub API token to use the service. At present this is specified as
the `token` field in `config.json`.

### Current Limtations

This tool is still under active development. A list of known issues follows:

- Only fetches the first 20 repos per org from the config file
- Only checks the master branch, so if your main branch is named something else
  you'll get a lot of false negatives.

## Contribute

If you would like to contribute code to this repository, please dive in! Check out [the issues](//github.com/mntnr/dashboard/issues).

## License

[MIT](LICENSE)
