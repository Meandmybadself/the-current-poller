'use strict'

const mongoose = require('mongoose')
const moment = require('moment')

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

function getPopularArtists () {
  const PAST_HOURS = 3
  const OLDEST_POST = moment().subtract(PAST_HOURS, 'hours').toDate()

  Track.aggregate(
    {$match: {
        date: {$gt: OLDEST_POST}
    }},
    {$unwind: '$artist'},
    {$group: {
        _id: '$artist',
        count: {$sum: 1}
    }},
    {$sort: {'count': -1}}
  )
    .exec((err, rsp) => {
      if (!err) {
        console.log(rsp)
      } else {
        console.log('Error in query.', err)
      }
    })
}

getPopularArtists()
