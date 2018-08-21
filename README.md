# Google Cloud Platform - Autocomplete  

1. AppEngine to store front end html and Nodejs app.js file using express.
2. Redis Labs hosted Memcached cloud used for caching query results. This is to improve product name completion time and provide suggestions in real time, with low-latency.
3. Cloud Datastore for storing product catalogue. The file datastore_load.js uses the Datastore client library to load all the product names to Datastore. products.json contains the product information.
