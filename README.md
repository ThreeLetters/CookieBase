# CookieBase
A Javascript Database based on Cookies.

## Goals

* Fast querying
* Easy acess
* Efficiency

## Documentation

> new CookieBase(tables[, options)

```js
var cookieBase = new CookieBase({
    test: {
        a: 'int', // types: 'int', 'str', 'float', 'json', 'rson'
        b: 'int',
        c: 'int'
    }
});

cookieBase.insert('test',{a:1,b:2,c:3});

// document.cookie: cookiebase_test_cc_0=1; cookiebase_test_cc_1=2; cookiebase_test_cc_2=3;
```

### insert

> cookieBase.insert(table, row/rows[, filterfunc)

Inserts rows

```js
cookieBase.insert('test',{a:1,b:2,c:3});


cookieBase.insert('test',[{a:4,b:5,c:6},{a:7,b:8,c:9}]);

```

### update

> cookieBase.insert(table, where, change[, filterfunc)

Updates rows

```js
cookieBase.update('test',{a:1},{b:3}); // searches for 1, and sets b to 3.

cookieBase.update('test',{a:[0,5]},{b:6}) // searches for a between 0 and 5, sets b to 6
```

### delete

> cookieBase.delete(table, where[, filterfunc)

Deletes rows

```js
cookieBase.delete('test',{a:1}); // searches for 1, and deletes rows.

cookieBase.delete('test',{a:[0,5]}) // searches for a between 0 and 5, deletes rows.
```

### select

> cookieBase.select(table, where[, filterfunc)

Returns rows

```js
cookieBase.select('test'); // returns all rows

cookieBase.select('test',{a:1}); // selects rows that has a = 1
```
