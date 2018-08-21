const fs = require("fs");

// Instantiates a Datastore client
var datastore = require('@google-cloud/datastore')({
  projectId: 'traffic-telemetry-212422',
});

// The kind for the Datastore entity
const kind = 'Products';
var task = [];
var taskKey = [];
//JSON file to parse
const file = 'products.json';
var i = 0;

var lineReader = require('readline').createInterface({
    input: fs.createReadStream(file)
});

lineReader.on('line', function (line) {
    line = line.trim();

    if (line.charAt(line.length-1) === ',') {
        line = line.substr(0, line.length-1);
    }

    if (line.charAt(0) === '{') {
        processRecord(JSON.parse(line));
        if (i == 500) {
            // Save the entity
            executeUpsert();
            i = 0;
        }
    }
});

/*
 * Function to process each record read from the file
 */
function processRecord(record) {
    console.log('Record sku = ' + record.sku);
    taskKey[i] = datastore.key([kind, record.sku]);
    // Prepare each entity
    task[i] = {
      key: taskKey[i],
      data: {
        name: record.name
      }
    };
    i++;
}

/*
 * Function to upload the json to datastore
 */
function executeUpsert() {
    datastore.upsert(task)
      .then(() => {
      })
      .catch((err) => {
        console.error('ERROR:', err);
      });
}
