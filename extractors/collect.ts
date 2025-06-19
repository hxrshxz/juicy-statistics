/*
 * Copyright (c) 2021-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as docker from './docker'
import * as github from './github'
import * as npm from './npm'

docker.collectData().then(
  () => {
    console.log(`Sucessfully collected docker stats for ${new Date().toString()}`)
  }
).catch((error) => {
  console.log('failed to collect docker stats', error)
})

github.collectData().then(
  () => {
    console.log(`Sucessfully collected github stats for ${new Date().toString()}`)
  }
).catch((error) => {
  console.log('failed to collect github stats', error)
})

npm.collectData().then(
  () => {
    console.log(`Sucessfully collected npm stats for ${new Date().toString()}`)
  }
).catch((error) => {
  console.log('failed to collect npm stats', error)
})
