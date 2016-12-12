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
        let cursor = 0
        d.data.songs.forEach((el) => {
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
                      process.stdout.write('+')
                      if (++cursor === l) {
                        wait()
                      }
                    })
                    .catch((e) => {
                      console.log('error', e)
                      if (++cursor === l) {
                        wait()
                      }
                    })
                }
              })
          }
        })
      }
    })
    .catch((err) => {
      console.log('err', err)
      wait()
    })
}

// Wait 30 seconds.
function wait () {
  console.log('wait.')
  setTimeout(() => {
    poll()
  }, 30000)
}

poll()
