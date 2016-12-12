'use strict'

const mongoose = require('mongoose')
const rp = require('request-promise')
const PLAYLIST_URL = 'http://nowplaying.publicradio.org/the-current/playlist'

const TrackSchema = new mongoose.Schema({
  'id': {type: 'String', required: true},
  'artist': {type: 'String', required: true},
  'album': {type: 'String', required: true},
  'played_at': {type: Date, required: true},
  'title': {type: 'String', required: true}
})
const Track = mongoose.model('Track', TrackSchema)

mongoose.Promise = global.Promise
mongoose.connect('mongodb://127.0.0.1/current', {db: {safe: true}})

function poll () {
  rp(PLAYLIST_URL)
    .then((data) => {
      let d = JSON.parse(data)
      let l = d.data.songs.length

      if (l) {
        // Promise array
        var p = []
        for (let i = 0; i < l; i++) {
          p.push(processItem(d.data.songs[i]))
        }
        Promise.all(p)
          .then((data) => {
            wait()
          })
          .catch((e) => {
            console.log('error in processing', e)
            wait()
          })
      }
    })
    .catch((err) => {
      console.log('err', err)
      wait()
    })
}

function processItem (el) {
  return new Promise((resolve, reject) => {
    if (el.artist) {
      let t = {
        id: el.artist + '|' + el.title + '|' + el.played_at,
        title: el.title,
        artist: el.artist,
        album: el.album,
        played_at: Date.parse(el.played_at)
      }

      Track.findOne({id: t.id}, 'id')
        .exec()
        .then((res) => {
          if (!res) {
            Track.create(t)
              .then((r) => {
                return resolve()
              })
              .catch((e) => {
                return reject(e)
              })
          } else {
            return resolve()
          }
        })
    } else {
      return resolve()
    }
  })
}

// Wait 30 seconds.
function wait () {
  setTimeout(() => {
    poll()
  }, 30000)
}

poll()
