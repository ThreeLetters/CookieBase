# CookieBase
A Javascript Database based on Cookies

## Goals

* Fast querying
* Easy acess
* Efficiency

## Documentation

> new CookieBase(tables[,options)

```js
var db = new CookieBase({
    test: {
        a: 'int', // types: 'int', 'str', 'float', 'json', 'rson'
        b: 'int',
        c: 'int'
    }
});

```