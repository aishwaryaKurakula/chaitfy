const arcjet = require('@arcjet/node').default;
const { shield, detectBot, slidingWindow } = require('@arcjet/node');

require("dotenv").config();

const express = require('express');
const ENV = require('../lib/env.js');

const aj = arcjet({
  key: ENV.ARCJET_KEY,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE", 
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
   slidingWindow({
     mode: "LIVE",
     max:100,
     interval:60,
    })  ,
  ],
});

module.exports = aj;
