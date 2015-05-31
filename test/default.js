
	
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
			assert.deepEqual(cache.getHashMap(), ['2', '3', '4', '5', '6']);
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
	});
	