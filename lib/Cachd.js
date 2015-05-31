!function() {

    var   Class         = require('ee-class')
        , log           = require('ee-log');




    var CacheItem = new Class({

        init: function(hash, value, nextNode, previousNode) {
            this.previousNode = previousNode;
            this.nextNode = nextNode;
            this.value = value;
            this.hash = hash;
            this.created = Date.now();
        }


        /**
         * returns if this is oldere than x msec
         */
        , isOlderThan: function(msecs) {
            return this.created < (Date.now()-msecs);
        }
    });






    module.exports = new Class({

        // the numebr of items to cache
        maxLength: 10000

        // ttl, dont store items older than this (msec)
        , ttl: 3600000

        // pointers for the linkedd list
        , lastNode: null
        , firstNode: null

        // counter
        , length: 0


        // user may set options
        , init: function(options) {
            if (options) {
                if (options.ttl) this.ttl = options.ttl;
                if (options.maxLength) this.maxLength = options.maxLength;
            }

            // a doubly linked list
            this.storage = {};
        }


        /**
         * adds a new value
         */
        , set: function(hash, value) {
            // store hash
            this.storage[hash] = new CacheItem(hash, value, null , this.firstNode);

            // set myself as nextnode
            if (this.firstNode) this.firstNode.nextNode = this.storage[hash];

            // set as first node
            this.firstNode = this.storage[hash];

            // set as last node if first item
            if (!this.lastNode) this.lastNode = this.firstNode;

            // increase counter
            this.length++;

            // check if there are too many items
            if (this.length > this.maxLength) {
                // kill the last node
                this.remove(this.lastNode.hash);
            }
        }


        /**
         * cehcks if there is an item
         */
        , get: function(hash) {
            this._cleanList();

            if (this.storage[hash]) return this.storage[hash].value;
            return undefined;
        }



        /**
         * cehcks if there is an item
         */
        , has: function(hash) {
            this._cleanList();

            return !!this.storage[hash];
        }


        /**
         * remove an item
         */
        , remove: function(hash) {
            if (this.storage[hash]) {
                if (this.storage[hash].nextNode) {
                    if (this.storage[hash].previousNode) {
                        // removing myself between two nodes
                        this.storage[hash].previousNode.nextNode = this.storage[hash].nextNode;
                        this.storage[hash].nextNode.previousNode = this.storage[hash].previousNode;
                    }
                    else {
                        // i'm the last node
                        this.lastNode = this.storage[hash].nextNode;
                        this.storage[hash].nextNode.previousNode = null;
                    }
                }
                else {
                    if (this.storage[hash].previousNode) {
                        // i'm the first node
                        this.firstNode = this.storage[hash].previousNode;
                        this.storage[hash].previousNode.nextNode = null;
                    }
                    else {
                        // i was the last node
                        this.lastNode = null;
                        this.firstNode = null;
                    }
                }

                this.length--;

                delete this.storage[hash];
            }
        }

        

        /**
         * remove outdated values
         */
        , _cleanList: function() {
            while (this.lastNode && this.lastNode.isOlderThan(this.ttl)) {
                this.remove(this.lastNode.hash);
            }
        }
    });
}();