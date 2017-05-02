# Cachd

[![Greenkeeper badge](https://badges.greenkeeper.io/eventEmitter/cachd.svg)](https://greenkeeper.io/)

A fast TTL Cache

for node >= 4.2


[![npm](https://img.shields.io/npm/dm/cachd.svg?style=flat-square)](https://www.npmjs.com/package/cachd)
[![Travis](https://img.shields.io/travis/eventEmitter/cachd.svg?style=flat-square)](https://travis-ci.org/eventEmitter/cachd)
[![node](https://img.shields.io/node/v/cachd.svg?style=flat-square)](https://nodejs.org/)

About the memory mangement:

The cache stops caching more items if the memory is getting full (> 70% of the heap used). It accepts
new items but removes the oldest ones before the ttl or max size is reached.


## API

Create cache instance

    var Cachd = require('cachd');


    var myCache = new Cachd({
          ttl: 3600000                  // max age of items in msec (default: 3600000 -> 1h)
        , maxLength: 1000               // the maximum of items to store (default: 10000)
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
