/*
 * Author : Akhilesh Warke
 * Project : GCP Autocomplete for product names
 * Date: 10 August 2018
 */

const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const memjs = require('memjs');
const Datastore = require('@google-cloud/datastore');
const app = express();

// GCP Project ID
const projectId = 'traffic-telemetry-212422';

// Initialize Datastore client
const datastore = Datastore({
  projectId: projectId
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text());
app.enable('trust proxy');

// Environment variables in "app.yaml"
let MEMCACHE_URL = process.env.MEMCACHE_URL || '127.0.0.1:11211';
let MEMCACHE_USERNAME = process.env.MEMCACHE_USERNAME
let MEMCACHE_PASSWORD = process.env.MEMCACHE_PASSWORD

/*
 * Create the memcache Client using environment variables
 */
const mc = memjs.Client.create(MEMCACHE_URL, {
  username: MEMCACHE_USERNAME,
  password: MEMCACHE_PASSWORD
});

// Start the server and listen on port 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
   console.log(`App listening on port ${PORT}`);
   console.log('Press Ctrl+C to quit.\n');
});

/*
 * Function to compute the next character of search string
 */
function getNextChar(c) {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}

/*
 * Function to compute the query end of the search string 
 */
function findStringEnd(start) {
    var lchar = start.slice(-1);
    var rchars = start.slice(0, -1);
    var nchar = getNextChar(lchar);
    return rchars.concat(nchar);
}

/*
 * Fetch the data from form
 */
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname+'/search.html'));
});

/* 
 * Perfom necessary computations on form data
 */
app.post('/data', function(req, res, next) {
    var data = req.body.term;
    console.log("\nKey to search for: '" + data + "'");
    var start = data;
    var end = findStringEnd(start);

    // Check in Memcache if this key exists
    mc.get(data, (err, value) => {
      if (err) {
        next(err);
        return;
      }
      if (value) {
        var results = JSON.parse(value);
        console.log("Key '" + data + "' found in Memcached!\n\n");
        res.status(200).send(results).end();
        return;
      }

      // Create the query for Datastore
      var matchingProducts = [];
      const query = datastore.createQuery('Products')
        .filter('name', '>=', start)
        .filter('name', '<', end);

      console.log("Key '" + data + "' not found in Memcached.. Searching Datastore.");
      datastore.runQuery(query)
        .then((results) => {
          // Query results obtained from Datastore
          const tasks = results[0];
          
          tasks.forEach((task) => {
            matchingProducts.push(task.name);
          });
           
          // Set the key in Memcached
          mc.set(data, JSON.stringify(matchingProducts), {expires:600}, (err) => {
            console.log("Setting key '" + data + "' in Memcached.. \n\n")
            if (err) {
              next(err);
              return;
            }
          });
          // Respond back to the client
          res.status(200).send(matchingProducts).end();
        });
    });
});
