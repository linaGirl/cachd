

	var   Class 		= require('ee-class')
		, log 			= require('ee-log')
		, assert 		= require('assert');



	var TTLCache = require('../')
		, cache;



	describe('The TTLCache', function(){
		it('should not crash when instantiated', function() {
			cache = new TTLCache({
				  ttl: 200
				, maxLength: 5
			});
		});


		it('should store items correctly', function() {
			cache.set('a', 1);
			assert(cache.has('a'));
			assert.equal(cache.get('a'), 1);
			assert.equal(cache.length, 1);

			cache.remove('a');

			assert(!cache.has('a'));
			assert.equal(cache.get('a'), undefined);
			assert.equal(cache.length, 0);
		});


		it('should remove old items', function(done) {
			cache.set('b', 2);
			cache.set('c', 3);

			setTimeout(function() {
				cache.set('d', 4);

				assert(!cache.has('b'));
				assert(cache.has('d'));
				assert.equal(cache.get('b'), undefined);
				assert.equal(cache.length, 1);

				cache.remove('d');

				done();
			}, 210);
		});


		it('should remove overflow items', function() {
			cache.set('1', 3);
			cache.set('2', 3);
			cache.set('3', 3);
			cache.set('4', 3);
			cache.set('5', 3);
			cache.set('6', 3);

			assert.equal(cache.length, 5);
		});


		it('all hashes should be listed', function() {
			var list = [];

			for (var key of cache.keys()) list.push(key);

			assert.deepEqual(list, ['2', '3', '4', '5', '6']);
		});


		it('should fire the add event', function(done) {
			cache.on('add', function(hash, value) {
				assert.equal(hash, 'evt');
				assert.equal(value, 3);
				done();
			});

			cache.set('evt', 3);
		});


		it('should fire the remove event', function(done) {
			cache.on('remove', function(hash, value) {
				assert.equal(hash, 'evt');
				assert.equal(value, 3);
				done();
			});

			cache.remove('evt', 3);
		});



		it('should be able to remove the least used nodes first', function() {
			var  list = []
				, keys = []
				, c;

			c = new TTLCache({
				  ttl: 20000
				, maxLength: 3
				, removalStrategy: 'leastUsed'
			});


			c.set(1, 'a');
			c.set(2, 'b');
			c.set(3, 'c');

			c.get(1);
			c.get(1);

			c.set(4, 'd');
			c.set(5, 'e');


			for (var val of c) list.push(val);
			for (var key of c.keys) keys.push(key);

			assert.deepEqual(list, ['a', 'e', 'd']);
			assert.deepEqual(keys, [1, 5, 4]);
		});



		it('should return the first and the last node correctly', function() {
			var  list;

			list = new TTLCache({
				  ttl: 20000
				, maxLength: 3
				, removalStrategy: 'leastUsed'
			});

			list.set(1, 'a');
			list.set(2, 'b');
			list.set(3, 'c');

			list.get(1);
			list.get(1);

			assert(list.getLast(), 'b');
			assert(list.getFirst(), 'a');
		});
	});
