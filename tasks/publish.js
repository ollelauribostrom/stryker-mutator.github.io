const { EOL } = require('os');
const { exec } = require('child_process');
const ncp = require('ncp').ncp;
const path = require('path');
const rimraf = require('rimraf');
ncp.limit = 16;

const PUBLISH_REQUIREMENTS = {
  pullRequest: 'false',
  branch: 'develop',
  nodeVersion: 'node'
};

console.log(`Running on branch ${process.env.TRAVIS_BRANCH}, version ${process.env.TRAVIS_NODE_VERSION}, pull request: ${process.env.TRAVIS_PULL_REQUEST}`);
console.log(`Release requirements: ${JSON.stringify(PUBLISH_REQUIREMENTS, null, 2)}`);

if (process.env.TRAVIS_PULL_REQUEST === PUBLISH_REQUIREMENTS.pullRequest
  && process.env.TRAVIS_BRANCH === PUBLISH_REQUIREMENTS.branch
  && process.env.TRAVIS_NODE_VERSION === PUBLISH_REQUIREMENTS.nodeVersion) {
  console.log('Alright man, let\'s do this!');
  publish()
    .then(() => console.log('Publish done'))
    .catch(error => console.error('Publish failed', error));
} else {
  console.log('That means no publish for you buddy');
}



function sh(command) {
  return new Promise((res, rej) => {
    log(command);
    exec(command, { encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) {
        rej(new Error(`${err}${EOL}stdout: ${stdout}${EOL}stderr: ${stderr}`));
      } else {
        res(stdout.trim());
      }
    });
  });
}

function copy(from, to) {
  log(`Copying ${from} -> ${to}...`);
  return new Promise((res, rej) => {
    ncp(from, to, function (err) {
      if (err) {
        return rej(err);
      } else {
        res();
      }
    });
  });
}

function rm(glob) {
  log(`rm ${glob}`);
  return new Promise((res, rej) => {
    rimraf(glob, err => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    });
  });
}

function log(message) {
  console.log(`Publish: ${message}`);
}

async function publish() {
  const desiredCwd = path.resolve(__dirname, '..');
  if (process.cwd() !== desiredCwd) {
    log(`Please run from ${desiredCwd}`)
  } else {
    const gitStatus = await sh('git status --short');
    if (gitStatus) {
      throw new Error(`Working directory is not clean${EOL}${gitStatus}`);
    }
    await sh('npx grunt build');
    await sh('git add package.json'); // the grunt contributors task changes newlines for some reason
    await copy('root', 'out');
    await copy('generated-root', 'out');
    await sh(`git remote add gh-publish https://${process.env.GIT_TOKEN}@github.com/stryker-mutator/stryker-mutator.github.io.git`);
    await sh('git fetch gh-publish');
    await sh('git checkout --track -b master gh-publish/master');
    await copy('out', '.');
    await rm('out');
    await rm('generated-root');
    await sh('git add .');
    await sh('git commit -m "Publish"');
    await sh('git push');
  }
}
