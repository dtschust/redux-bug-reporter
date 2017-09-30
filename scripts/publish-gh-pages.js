#!/usr/bin/env node
const ghpages = require('gh-pages')
const path = require('path')

ghpages.publish(path.join(__dirname, '../example'), (err) => {
  if (err) {
    console.log('Error publishing to gh-pages:', err)
  }
})
