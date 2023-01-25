/*
This file contains the configuration for semantic release, the library we use to tag the correct
semantic version numbers onto releases. We have two release paths, one on master and one on dev branch.

In the code below we check the env variable RELEASE_BRANCH to decide what we should do. As of
the time of this file semantic release does not support specifying a config file from their CLI,
so this is the only we can have dynamic configs based on branch.

To test run this file, first get a github token at https://github.com/settings/tokens
and add it to the GITHUB_TOKEN env variable then specify what branch you want to run (master or dev) under RELEASE_BRANCH

$ export GITHUB_TOKEN=<token>
$ export RELEASE_BRANCH=<main or release>
$ run yarn run semantic-release -d


*/

const commitAnalyzerSetting = [
    '@semantic-release/commit-analyzer',
    {
        preset: 'angular',
        releaseRules: [
            {
                type: 'feat',
                release: 'minor',
            },
            {
                type: '*',
                release: 'patch',
            },
        ],
        parserOpts: {
            noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
    },
];

const gitSetting = [
    '@semantic-release/git',
    {
        assets: ['package.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    },
];

/**
 * This is used to publish to npm
 */
const npmRelease = [
    '@semantic-release/npm',
    {
        npmPublish: true,
        pkgRoot: 'dist',
    },
];

const changelogGen = ['@semantic-release/changelog', {}];

const releaseNotesGen = ['@semantic-release/release-notes-generator', {}];

const plugins = [commitAnalyzerSetting, changelogGen, releaseNotesGen, npmRelease, gitSetting];

module.exports = {
    branches: [
        {
            name: 'master',
        },
        {
            name: 'dev',
            prerelease: 'alpha',
        },
    ],
    plugins,
};