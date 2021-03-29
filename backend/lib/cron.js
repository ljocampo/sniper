const cron = require('node-cron');
const scrapeListings = require('./scrapeListings');
const scrapeFacebookListings = require('./scrapeFacebook');

// every 3 mins
pattern = '0 7-23/2 * * *'
if (cron.validate(pattern)) {
  cron.schedule(pattern, async () => {
    // scrapeListings();
    scrapeFacebookListings();
    console.log('Done scrapes!');
  });
} else {
  console.log('Invalid cron settings!');
}
