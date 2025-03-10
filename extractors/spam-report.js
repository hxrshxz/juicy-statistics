/*
 * Copyright (c) 2021-2024 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const REPO_OWNER = 'juice-shop'
const REPO_NAME = 'juice-shop'
const LABEL = 'spam'
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'spam-history.json')

const getDateString = (date) => {
  return date.toISOString().split('T')[0]
}

const getData = async (date) => {
  const startDate = new Date(date)
  startDate.setUTCHours(0, 0, 0, 0)
  const endDate = new Date(date)
  endDate.setUTCHours(23, 59, 59, 999)

  let spamIssues = []
  let spamPRs = []
  let page = 1
  let history = []

  const headers = {
    Accept: 'application/vnd.github.v3+json'
  }
  
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  try {
    while (true) {
      const response = await fetch(
        `${GITHUB_API_URL}?labels=${LABEL}&state=closed&since=${startDate.toISOString()}&until=${endDate.toISOString()}&per_page=100&page=${page}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.length === 0) break

      data.forEach((item) => {
        const closedDate = new Date(item.closed_at);
        if (closedDate >= startDate && closedDate <= endDate) {
          if (item.pull_request) {
            spamPRs.push(item)
          } else {
            spamIssues.push(item)
          }
        }
      })

      page++
    }

    // Store daily data in a structured format
    const dailyData = {
      date: getDateString(startDate),
      totalSpamPRs: spamPRs.length,
      totalSpamIssues: spamIssues.length
    }

    // Append daily data to history
    history.push(dailyData)

    // Write daily data to file
    const dataDir = path.join(__dirname, '..', 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
    console.log(`Data for ${getDateString(startDate)} written to file`)

    // Return the structured history for the day
    return history
  } catch (error) {
    console.error('Error fetching spam data:', error.message)
    return []
  }
}

// const updateHistory = async () => {
//   // Create data directory if it doesn't exist
//   const dataDir = path.join(__dirname, '..', 'data')
//   if (!fs.existsSync(dataDir)) {
//     fs.mkdirSync(dataDir, { recursive: true })
//   }

//   let history = []
//   if (fs.existsSync(HISTORY_FILE)) {
//     history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
//   }

//   // Get yesterday's date
//   const yesterday = new Date()
//   yesterday.setDate(yesterday.getDate() - 1)
//   const yesterdayString = getDateString(yesterday)

//   // Check if we already have data for yesterday
//   if (!history.some(entry => entry.date === yesterdayString)) {
//     const dailyData = await getData(yesterday)
//     history.push(dailyData)
    
//     // Sort by date
//     history.sort((a, b) => new Date(a.date) - new Date(b.date))
    
//     // Write updated history to file
//     fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
//     console.log(`Added data for ${yesterdayString}`)
//   } else {
//     console.log(`Data for ${yesterdayString} already exists`)
//   }
// }

// For initial population of historical data
const populateHistoricalData = async (startDate, endDate) => {
  let history = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const dailyData = await getData(current)
    // Append dailyData directly as an object
    history.push(...dailyData) // Use spread operator to flatten the array
    current.setDate(current.getDate() + 1)
  }

  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, '..', 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
  console.log('Historical data population complete')
}


// Export for CI usage
module.exports = {
  getData,    
  // updateHistory,
  populateHistoricalData
}

// If running directly, update the history
// if (require.main === module) {
//   updateHistory()
// }
populateHistoricalData('2018-07-16', '2025-03-8')

