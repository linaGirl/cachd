!function() {

    var   Class         = require('ee-class')
        , EventEmitter  = require('ee-event-emitter')
        , log           = require('ee-log')
        , Linkd         = require('linkd')
        , MemoryManager = require('memory-manager')
        , argv          = require('ee-argv');




    var CacheItem = new Class({

        init: function(value) {

            // need this for the ttl coputation
            this.created = Date.now();

            // this is used for computing the least used item
            this.hits = 1;

            // and  finally the value
            this.value = value;
        }


        /**
         * returns if this is oldere than x msec
         */
        , isOlderThan: function(msecs) {
            return this.created < (Date.now()-msecs);
        }
    });






    classDefinition = {
        inherits: EventEmitter

        // the numebr of items to cache
        , maxLength: 10000

        // ttl, dont store items older than this (msec)
        , ttl: 3600000


        // the amount of olf entries to remove when we're running out of memory
        , memoryLimitRemoveAmount: 5

        // removal startegy for the situation when
        // the cache is overflowing
        , removalStrategy: 'oldest'


        // how many ms to wait between ttl checks
        , ttlCheckFrequency: 30000


        // the length of all items in the cache
        , length: {
              get: function() {
                  return this.ttlList.length;
              }
        }



        // user may set options
        , init: function(options) {

            if (options) {
                if (options.ttl) this.ttl = options.ttl;
                if (options.maxLength) this.maxLength = options.maxLength;


                // removal strategy
                if (options.removalStrategy) this.removalStrategy = options.removalStrategy;
            }


            // we track the memory usage using the v8 module
            this.memoryManager = new MemoryManager({
                minFree: 30
            });



            // set up two linked list
            this.ttlList = new Linkd();

            // set up a second linked lsit if we're filtering for age too
            if (this.removalStrategy === 'leastUsed') {
                this.ageList = new Linkd();

                // make sure the age lsit contains the same data as the ttl list
                this.setupListSync();
            }

            // pass events
            this.setUpEvents();


            // add th ekeys iterator
            this.keys[Symbol.iterator] = keyIterator.bind(this);


            // set up ttl check
            setInterval(this._removeOutdatedNodes.bind(this), this.ttlCheckFrequency);
        }




        /**
         * pass events form the lists to listeners on this class
         *
         * @private
         */
        , setUpEvents: function() {
            this.ttlList.on('addNode', function(node) {
                this.emit('add', node.hash, node.value.value);
                this.emit('addNode', node.hash, node.value);
            }.bind(this));

            this.ttlList.on('removeNode', function(node) {
                this.emit('remove', node.hash, node.value.value);
                this.emit('removeNode', node.hash, node.value);
            }.bind(this));
        }



        /**
         * keeps both linked lists up to date so that they
         * always contain the same itemms.
         *
         * @private
         */
        , setupListSync: function() {

            // increase hit counter
            this.ttlList.on('getNode', function(node) {


                // increase the hit counter
                if (!this.ageList.has(node.hash)) throw new Error('Cannot modify node, the lists are out of sync, the ageList doesn\'t contain the hash «'+node.hash+'»!');
                else {
                    var   ageNode = this.ageList.getNode(node.hash)
                        , currentNode = ageNode;

                    // increase hit counter
                    ageNode.value.hits++;

                    // find the next bigegr node
                    while(currentNode.hasNext() && ageNode.value.hits >= currentNode.value.hits) {
                        currentNode = currentNode.getNext();
                    }

                    // we need to move if we found node with less hits
                    if (currentNode !== ageNode) this.ageList.moveBefore(ageNode, currentNode);
                }
            }.bind(this));
        }





        /**
         * remove nodes by one of the supported strategies:
         * remove the oldest first or the least used first
         *
         * @private
         * @param {integer} [howMany=1] optional the amount of nodes to remove
         */
        , removeNodes: function(howMany) {
            var node;

            // remove nodes as long there are any
            while(howMany-- && this.ttlList.length) {
                if (this.removalStrategy === 'oldest') {
                    node = this.ttlList.shiftNode();
                }
                else if (this.removalStrategy === 'leastUsed') {
                    node = this.ageList.shiftNode();

                    // remove from second list too
                    this.ttlList.remove(node.hash);
                }
                else throw new Error('Invalid removal strategy «'+this.removalStrategy+'»!');
            }
        }





        /**
         * adds a new value
         */
        , set: function(hash, value) {
            var item, currentNode;

            // check if we  need to remove old entried
            if (!this.memoryManager.hasMemory()) this.removeNodes(this.memoryLimitRemoveAmount);


            // if the value exists already: remove it and add it as new item
            if (this.ttlList.has(hash)) {
                this.ttlList.remove(hash);
                if (this.ageList) this.ageList.remove(hash);
            }


            // store on an object, this will save a lot of space
            // because we store stuff in two separate linked lists
            item = new CacheItem(value);

            // store
            this.ttlList.push(hash, item);
            if (this.ageList) {
                // not unshifting the node because it would be removed
                // again if the list is too long. trying to move it after
                // the next item with the next bigger hit count
                currentNode = this.ageList.getLastNode(true)

                // find the next bigger node
                while(currentNode) {

                    // we found the next bigger node
                    if (currentNode.value.hits > 1 || !currentNode.hasNext()) break;
                    else currentNode = currentNode.getNext();
                }

                // insert in between if the node was found and the hist are > 1
                // if no node was found or the hits are not > 1 add it as first node
                if (currentNode && currentNode.value.hits > 1) this.ageList.addAfter(hash, item, currentNode);
                else this.ageList.push(hash, item);
            }


            // if the maylength was exceeded we need to remove one node
            if (this.length > this.maxLength) this.removeNodes(1);
        }




        /**
         * returns the last value, depending on the removal strategy
         */
        , getLast: function() {
            var node = this.getLastNode();
            return node ? node.value : null;
        }




        /**
         * returns the last node, depending on the removal strategy
         */
        , getLastNode: function() {
            if (this.removalStrategy === 'leastUsed') return this.ageList.length ? this.ageList.getLastNode() : null;
            else return this.ttlList.length ? this.ttlList.getLastNode() : null;
        }




        /**
         * returns the last value, depending on the removal strategy
         */
        , getFirst: function() {
            var node = this.getFirstNode();
            return node ? node.value : null;
        }




        /**
         * returns the last node, depending on the removal strategy
         */
        , getFirstNode: function() {
            if (this.removalStrategy === 'leastUsed') return this.ageList.length ? this.ageList.getFirstNode() : null;
            else return this.ttlList.length ? this.ttlList.getFirstNode() : null;
        }




        /**
         * alias for set
         */
        , add: function(hash, value) {
            return this.set(hash, value);
        }





        /**
         * cehcks if there is an item
         */
        , get: function(hash) {
            this._removeOutdatedNodes();

            if (this.ttlList.has(hash)) return this.ttlList.get(hash).value;
            return undefined;
        }





        /**
         * return a list of all hashes
         */
        , keys: function() {
            return this.ttlList.keys();
        }





        /**
         * cehcks if there is an item
         */
        , has: function(hash) {
            this._removeOutdatedNodes();

            return this.ttlList.has(hash);
        }





        /**
         * remove an item
         */
        , remove: function(hash) {
            if (this.ttlList.has(hash)) {
                this.ttlList.remove(hash);
                if (this.ageList) this.ageList.remove(hash);
            }
        }






        /**
         * remove outdated values
         */
        , _removeOutdatedNodes: function() {
            var node;

            while (this.ttlList.length && this.ttlList.getLast(true).isOlderThan(this.ttl)) {
                node = this.ttlList.shiftNode();
                if (this.ageList) this.ageList.remove(node.hash);
            }
        }
    };





    /**
     * returns an ES6 iterator object for all values
     *
     * @returns {Iterator} Iterator object
     */
    classDefinition[Symbol.iterator] = function() {
        var currentNode = this.removalStrategy === 'leastUsed' ? this.ageList.getFirstNode(true) : this.ttlList.getFirstNode(true);

        return {
            next: function() {
                var returnNode;

                if (currentNode) {
                    returnNode = currentNode;   
                    currentNode = currentNode.previousNode || null;

                    return {value: returnNode.value.value, done: false};
                }
                else return {done: true};
            }
        };
    };




    /**
     * returns an ES6 iterator object for all keys
     *
     * @returns {Iterator} Iterator object
     */
    keyIterator = function() {
        var currentNode = this.removalStrategy === 'leastUsed' ? this.ageList.getFirstNode(true) : this.ttlList.getFirstNode(true);

        return {
            next: function() {
                var returnNode;

                if (currentNode) {
                    returnNode = currentNode;
                    currentNode = currentNode.previousNode || null;

                    return {value: returnNode.hash, done: false};
                }
                else return {done: true};
            }
        };
    };




    module.exports = new Class(classDefinition);
}();
