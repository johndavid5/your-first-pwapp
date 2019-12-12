/* eslint-env node */
/*
 * @license
 * Your First PWA Codelab (https://g.co/codelabs/pwa)
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */
'use strict';

const express = require('express');
const path = require('path');

const fetch = require('node-fetch');
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

// If running locally, get ENV from JavaScript object...
const { env } = require('./env.js');
console.log(`SHEMP: Moe env from ./env.js = `, env );

// CODELAB: Change this to add a delay (ms) before the server responds.
const FORECAST_DELAY = 0;

// CODELAB: If running locally, set your Dark Sky API key here
//const API_KEY = process.env.DARKSKY_API_KEY;
// CODELAB: Or get the Dark Sky API key from ./env.js...
const API_KEY = env.DARKSKY_API_KEY;
console.log(`SHEMP: Moe, API_KEY = `, API_KEY );

const LISTEN_PORT = env.LISTEN_PORT;
console.log(`SHEMP: Moe, LISTEN_PORT = `, LISTEN_PORT );

const BASE_URL = `https://api.darksky.net/forecast`;

// Fake forecast data used if we can't reach the Dark Sky API
const fakeForecast = {
  fakeData: true,
  latitude: 0,
  longitude: 0,
  timezone: 'America/New_York',
  currently: {
    time: 0,
    summary: 'Clear',
    icon: 'clear-day',
    temperature: 43.4,
    humidity: 0.62,
    windSpeed: 3.74,
    windBearing: 208,
  },
  daily: {
    data: [
      {
        time: 0,
        icon: 'partly-cloudy-night',
        sunriseTime: 1553079633,
        sunsetTime: 1553123320,
        temperatureHigh: 52.91,
        temperatureLow: 41.35,
      },
      {
        time: 86400,
        icon: 'rain',
        sunriseTime: 1553165933,
        sunsetTime: 1553209784,
        temperatureHigh: 48.01,
        temperatureLow: 44.17,
      },
      {
        time: 172800,
        icon: 'rain',
        sunriseTime: 1553252232,
        sunsetTime: 1553296247,
        temperatureHigh: 50.31,
        temperatureLow: 33.61,
      },
      {
        time: 259200,
        icon: 'partly-cloudy-night',
        sunriseTime: 1553338532,
        sunsetTime: 1553382710,
        temperatureHigh: 46.44,
        temperatureLow: 33.82,
      },
      {
        time: 345600,
        icon: 'partly-cloudy-night',
        sunriseTime: 1553424831,
        sunsetTime: 1553469172,
        temperatureHigh: 60.5,
        temperatureLow: 43.82,
      },
      {
        time: 432000,
        icon: 'rain',
        sunriseTime: 1553511130,
        sunsetTime: 1553555635,
        temperatureHigh: 61.79,
        temperatureLow: 32.8,
      },
      {
        time: 518400,
        icon: 'rain',
        sunriseTime: 1553597430,
        sunsetTime: 1553642098,
        temperatureHigh: 48.28,
        temperatureLow: 33.49,
      },
      {
        time: 604800,
        icon: 'snow',
        sunriseTime: 1553683730,
        sunsetTime: 1553728560,
        temperatureHigh: 43.58,
        temperatureLow: 33.68,
      },
    ],
  },
};

/**
 * Generates a fake forecast in case the weather API is not available.
 *
 * @param {String} location GPS location to use.
 * @return {Object} forecast object.
 */
function generateFakeForecast(location) {
  location = location || '40.7720232,-73.9732319'; // Defaults to NYC
  const commaAt = location.indexOf(',');

  // Create a new copy of the forecast
  const result = Object.assign({}, fakeForecast);
  result.latitude = parseFloat(location.substr(0, commaAt));
  result.longitude = parseFloat(location.substr(commaAt + 1));
  return result;
}


/**
 * Gets the weather forecast from the Dark Sky API for the given location.
 *
 * @param {Request} req request object from Express.
 * @param {Response} resp response object from Express.
 */
function getForecast(req, resp) {
  const location = req.params.location || '40.7720232,-73.9732319';
  const url = `${BASE_URL}/${API_KEY}/${location}`;
  console.log(`SHEMP: Moe fetchin' dha forecast from url=${url}...`);
  fetch(url).then((resp) => {
    if (resp.status !== 200) {
      throw new Error(resp.statusText);
    }
    return resp.json();
  }).then((data) => {
    setTimeout(() => {
      resp.json(data);
    }, FORECAST_DELAY);
  }).catch((err) => {
    console.error('Dark Sky API Error:', err.message);
    resp.json(generateFakeForecast(location));
  });
}

/**
 * Starts the Express server.
 *
 * @return {ExpressServer} instance of the Express server.
 */
function startServer() {
  const app = express();

  // Redirect HTTP to HTTPS,
  // NOTE: Don't use this if NginX is already re-directing to https, or else
  // you'll get endless redirects and ERR_TOO_MANY_REDIRECTS
  //app.use(redirectToHTTPS([/localhost:(\d{4})/], [], 301));

  // Logging for each request
  app.use((req, resp, next) => {
    const now = new Date();
    const time = `${now.toLocaleDateString()} - ${now.toLocaleTimeString()}`;
    const path = `"${req.method} ${req.path}"`;
    const m = `${req.ip} - ${time} - ${path}`;
    // eslint-disable-next-line no-console
    console.log(m);
    next();
  });

  // Handle requests for the data
  app.get('/forecast/:location', getForecast);
  app.get('/forecast/', getForecast);
  app.get('/forecast', getForecast);

  // And if it comes in via reverse-proxy prefix, too...
  //app.get('/weather-pwa/forecast/:location', getForecast);
  //app.get('/weather-pwa/forecast/', getForecast);
  //app.get('/weather-pwa/forecast', getForecast);

 
  //const fileAssets = express.static(path.join(__dirname, './public'))

  //const fileAssets = express.static('public')
  //app.use('/weather-pwa', fileAssets) 
  //app.use(fileAssets) 


  // Handle requests for static files
  app.use(express.static('public'));

  // And if it comes in via reverse-proxy prefix, too...
  //app.use('/weather-pwa', express.static('public'));

  // Start the server
  return app.listen(LISTEN_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Local DevServer Started on port ${LISTEN_PORT}...`);
  });
}

startServer();
