# Cachd

A fast TTL Cache implementation


[![npm](https://img.shields.io/npm/dm/cachd.svg?style=flat-square)](https://www.npmjs.com/package/cachd)
[![Travis](https://img.shields.io/travis/eventEmitter/cachd.svg?style=flat-square)](https://travis-ci.org/eventEmitter/cachd)
[![node](https://img.shields.io/node/v/cachd.svg?style=flat-square)](https://nodejs.org/)


## API

Create cache instance

    var Cachd = require('cachd');


    var myCache = new Cachd({
          ttl: 3600000 // max age of items in msec
        , maxLength: 1000 // the maximum of items to store
    });



Add item. You have to pass a unique hash and the value.


    myCache.set(hash, value);



Check if an item exists


    if (myCache.has(hash)) {
        // there it is ;)
    }


Get an item


    var item = myCache.get(hash);


Remove an item 


    myCache.remove(hash);