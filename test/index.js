import {
  back as nockBack
} from 'nock'
import assert from 'assert'
import debug from 'debug'
import undisco from '../lib'
import sinon from 'sinon'
import http from 'http'
import hjson from 'hjson'
import {
  readFileSync
} from 'fs'

// eslint-disable-next-line no-unused-vars
const dbg = debug('undisco:test')

/**
 * nockBack records http requests and replays them next time the tests are run
 * the first time you run these tests, the requests will be sent to
 * themoviedb.org, so you'll need your apiKey in ../config.hjson
 * thereafter, the requests won't actually be sent.
 * to avoid committing your apiKey, the stored requests are .gitignored.
 */
nockBack.setMode('record')
nockBack.fixtures = 'test/fixtures/nockBack'

const config = Object.assign(
  hjson.parse(readFileSync('./config.hjson', 'utf8')),
  {
    once: true,
    dump: {
      writeDump: false
    },
    destPaths: {
      archives: {
        tv: '/tmp/tv',
        movie: '/tmp/movies'
      }
    }
  }
)

describe('undisco', () => {
  beforeEach(function () {
    // create spy
    // sinon.spy(cloudinary.api, 'resources')
    this.requestSpy = sinon.spy(http, 'request')
  })
  afterEach(function () {
    this.requestSpy.restore()
    // cloudinary.api.resources.restore()
  })
  it('resolve movie from path', (done) => {
    nockBack('1', (writeRequests) => {
      const opt = Object.assign({}, config, {downloadsPath: 'test/fixtures/1'})
      undisco(opt)
      .then((dump) => {
        // console.log(dump[0].files)
        assert(dump[0].tmdb.title, 'Hostiles')
        writeRequests()
        done()
      })
    })
  })
  it('resolve tv from path', (done) => {
    nockBack('2', (writeRequests) => {
      const opt = Object.assign({}, config, {downloadsPath: 'test/fixtures/2'})
      undisco(opt)
      .then((dump) => {
        assert(dump[0].placeholders.title, 'Fringe')
        writeRequests()
        done()
      })
    })
  })
  it('resolve from nfo', (done) => {
    nockBack('3', (writeRequests) => {
      const opt = Object.assign({}, config, {downloadsPath: 'test/fixtures/3'})
      undisco(opt)
      .then((dump) => {
        // console.log(dump[0].files)
        assert(dump[0].placeholders.title, 'Old Boy')
        writeRequests()
        done()
      })
    })
  })
  it('extract rar', (done) => {
    nockBack('4', (writeRequests) => {
      const opt = Object.assign({}, config, {downloadsPath: 'test/fixtures/4'})
      undisco(opt)
      .then((dump) => {
        // console.log(dump[0].files)
        assert(dump[0].placeholders.title, 'Fringe')
        writeRequests()
        done()
      })
    })
  }).timeout(5000)
})
