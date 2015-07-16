# Cachd

A fast TTL Cache

for node. 0.12+, io.js


[![npm](https://img.shields.io/npm/dm/cachd.svg?style=flat-square)](https://www.npmjs.com/package/cachd)
[![Travis](https://img.shields.io/travis/eventEmitter/cachd.svg?style=flat-square)](https://travis-ci.org/eventEmitter/cachd)
[![node](https://img.shields.io/node/v/cachd.svg?style=flat-square)](https://nodejs.org/)

About the memory mangement:

The cache stops caching more items if the memory is getting full. It accepts
new items but removes the oldest ones before the ttl or max size is reached.
It expects the maximum of available memory for the node.js process to be 1.6 GB.
It stops caching items when only 200mb of memory are left for the process. You
may override the thresholds using the maxMemory and minFreeMemory options.


## API

Create cache instance

    var Cachd = require('cachd');


    var myCache = new Cachd({
          ttl: 3600000                  // max age of items in msec (default: 3600000 -> 1h)
        , maxLength: 1000               // the maximum of items to store (default: 10000)
        , maxMemory: 3000               // the maximum of memory the node.js process can use (default: 1600mb)
        , minFreeMemory: 500            // start removing old items from the cache if the free
                                        // memory is less than 500mb (default: 200mb)
        , removalStrategy: 'leastUsed'  // remove the least used items if the cache is getting
                                        // too full (default: oldest)
    });



Add item. You have to pass a unique hash and the value.


    myCache.set(hash, value);

    // alias of set
    myCache.add(hash, value);



Check if an item exists


    if (myCache.has(hash)) {
        // there it is ;)
    }


Get an item


    var item = myCache.get(hash);


Remove an item


    myCache.remove(hash);



Get all hashes

    var hashMap = myCache.getHashMap();


Get first cached item. This is the most accessed item if the cache has the
«leastUsed» removal strategy, else its the most recent added item.

    var item = mycache.getFirst();


Get last cached item. This is the least accessed item if the cache has the
«leastUsed» removal strategy, else its the least recent added item.

    var item = mycache.getFirst();


## Events


the cache emits events when an item is added or one is removed

    myCache.on('add', function(hash, value) {

    });


    myCache.on('remove', function(hash, value) {

    });
