## undiscombobulate

![github-issues](https://img.shields.io/github/issues/fauxilla/undiscombobulate.svg) ![stars](https://img.shields.io/github/stars/fauxilla/undiscombobulate.svg) ![forks](https://img.shields.io/github/forks/fauxilla/undiscombobulate.svg)

extensible post processing for movies & tv

Undisco scans your completed downloads, identifies the movie or tv episode, and copies the release into your media archive with appropriate file names.

Take a look at the awesome [annotated code](https://fauxilla.github.io/undiscombobulate/lib/index.js.html)

Be aware the current release is alpha quality, don't run it on media archives you don't want to lose.

## install & run binaries

This is convenient because you don't need to install nodejs & npm.

 * go to [release page](https://github.com/fauxilla/undiscombobulate/releases) & download binary
 * copy `config.sample.hjson` from this repo to `config.hjson` in the same
   directory as your binary and configure paths
   [hjson reference](http://hjson.org/)

## install & run from source

 * be awesome
 * install nodejs & npm
 * clone this repo somewhere like `/opt/`
 * copy `config.sample.hjson` to `config.hjson` and configure paths
   [hjson reference](http://hjson.org/)
 * `npm i` to install all the things
 * `npm run babel` to transpile code
 * start with `npm start`

## clone repo & build your own binaries

 * clone this repo
 * `npm i` to get dependencies
 * `npm run babel` to transpile to node 9
 * `npm run pkg-linux` or `npm run pkg-win`
 * binary will be output to `bin/`

## run as a service

  * copy binary or clone repo to `/opt/undiscombobulate`
  * create config in that dir
  * copy `undiscombobulate.service` into `/etc/systemd/system`
  * modify `ExecStart` and `WorkingDirectory` paths in that file
  * make your entry point executable, so `chmod +x dist/index.js` if you're running from source or `chmod +x undisco-linux-x64` if you're running binaries
  * make `dist/service.js` executable as in `chmod +x dist/service.js`
  * start with `sudo systemctl start undiscombobulate.service`
  * check logs with `sudo journalctl -u undiscombobulate.service`
  * start on boot with `sudo systemctl enable undiscombobulate.service`

## run from cli

There are a few command line args which are helpful for testing your config:

 * `--once` / `-o` : forces 'run once' mode.
 * `--no-dump` / `-n` : won't write dump files to source directories.

everytime undisco processes a directory, it will write a dump of meta / logs to the source directory. Next time undisco processes that directory, it will skip processing it if its been successfully processed already. Therefore, using the `-n` option means that undisco won't know a directory has already been processed next time it looks at it.

if you have source you can `npm start`, if you want to pass in command line args it looks like `npm start -- -n -o`

## watching vs polling

In the options you can specify a watch option (true / false) or a poll option
(minutes or false). Watching file systems in general is pretty shady, it might
work for you, it might not. Polling isnt great either because theres always
a delay, and your hard drives wont go to sleep. So try watching and if that
doesn't work fall back to polling.

## windows

Untested on windows. You'd need to change all the paths in `config.hjson` so the slash is `\`, and ensure you had `unrar` in your path. There's probably other problems as well, I'd love to hear from someone about this.

## modules

Undisco has a modular architecture, and is very easy to extend. You could create your own module in the root dir, then add the full list of modules to `config.hjson`
with the path `../myModule`. It might look like this:

```
{
  modules: [
    listFiles
    skip
    unrar
    readNfo
    parseName
    tmdb
    ../myModule
    placeholders
    ignore
    destPaths
    copy
    clean
  ]
}
```

Take a look in `/modules/` for examples of how modules work.

## scripts

 - **npm run start** : `cross-env DEBUG=undisco* node dist`
 - **npm run build** : `npm run babel && npm run client:prodn && npm run docs && cp docs/README.md.html docs/index.html && npm run gh-pages`
 - **npm run readme** : `node-readme`
 - **npm run babel** : `babel lib -d dist --ignore client`
 - **npm run babel:watch** : `babel lib --watch -d dist --ignore client`
 - **npm run test** : `cross-env DEBUG=undisco* NODE_ENV=test mocha --compilers js:babel-register test`
 - **npm run test:watch** : `cross-env DEBUG=undisco* NODE_ENV=test mocha --compilers js:babel-register --watch test`
 - **npm run docs** : `npm run readme && rm -fr ./docs/* && docker -o ./docs -I -x dist,.README.md,test/fixtures,node_modules,docs`
 - **npm run gh-pages** : `gh-pages -d docs`
 - **npm run pkg-linux** : `pkg . --targets node8-linux --output bin/undisco-linux-x64`
 - **npm run pkg-win** : `pkg . --targets node8-win --output bin/undisco-win-x64.exe`
 - **npm run pkg** : `npm run pkg-linux && npm run pkg-win`

## developing / testing / contributing

Suggestions / contributions are absolutely welcome.

Use `npm run babel` or `npm run babel:watch` to transpile source from `lib` to
`dist`, then `npm start` to run.

test with `npm run test` or `npm run test:watch`

If you want to contribute anonymously, take a look at [gitmask](https://www.gitmask.com/), you basically upload your commit to gitmask and it destroys your id before making a PR.
