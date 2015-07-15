



    var TTLCache = require('./')
        , assert = require('assert');



    var  list = []
        , c;

    c = new TTLCache({
          ttl: 2000000000
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

    assert.deepEqual(list, [5, 4, 1]);
