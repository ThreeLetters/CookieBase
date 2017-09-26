"use strict";
/*
MIT License

Copyright (c) 2017 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// BUILD BETWEEN
class CookieBase {
    constructor(tables, options) {
        this.tables = tables;
        this.data = {};
        this.initTables()
        this.parse();
        this.finish();
        this.options = options || {};
        this.append = this.optionStr(this.options, 1);
        this.append2 = this.optionStr(this.options, 0);
    }

    optionStr(options, s) {
        var str = [];

        if (s && options.expires) str.push('expires=' + options.expires + ';')
        if (options.path) str.push('path=' + options.path + ';')
        if (options.domain) str.push('domain=' + options.domain + ';')
        if (options.secure) str.push('secure;');

        return str.join('')
    }

    initTables() {
        for (var i in this.tables) {
            this.data[i] = {
                name: i,
                struct: this.tables[i],
                data: [],
                deleted: 0
            }
        }
    }

    parse() {
        var cookies = document.cookie;
        var split = cookies.split(/; ?/);

        split.forEach((cookie) => {
            var s = cookie.split('=');

            if (s[0].substr(0, 11) === 'cookiebase_') {
                var a = s[0].substr(11).split('_cc_');

                var table = a[0];
                var row = a[1];
                var column = a[2];

                if (!this.data[table].data[row]) this.data[table].data[row] = {};
                this.data[table].data[row][column] = this.decast2(decodeURIComponent(s[1]), this.data[table].struct[column]);
            }
        })
    }

    finish() {

        for (var i in this.data) {
            var table = this.data[i];
            var Tree = new KDTree(Object.keys(table.struct));

            table.tree = Tree;

            for (var j in table.data) {
                Tree.insert(table.data[j]);
            }
        }

    }

    cast(val, type) {
        switch (type) {
            case 'int':
                return parseInt(val);
                break;
            case 'float':
                return parseFloat(val);
                break;
            case 'str':
                return val;
                break;
            case 'json':
                return JSON.stringify(val);
                break;
            case 'rson':
                return RSON.stringify(val);
                break;
        }
    }

    decast(val, type) {
        switch (type) {
            case 'int':
                return parseInt(val);
                break;
            case 'float':
                return parseFloat(val);
                break;
            case 'str':
                return val;
                break;
            case 'json':
                return JSON.parse(val);
                break;
            case 'rson':
                return RSON.parse(val);
                break;
        }
    }
    decast2(val, type) {
        if (type === 'str' || type === 'rson' || type === 'json') return val;
        else if (type === 'int') return parseInt(val);
        else if (type === 'float') return parseFloat(val);
    }

    apply(dt, cond) {
        for (var i in dt.struct) {
            if (cond[i]) {
                if (dt.struct[i] === 'json' || dt.struct[i] === 'rson') {
                    cond[i] = this.cast(cond[i], dt.struct[i])
                } else if (cond[i][0] && cond.length === 2) {
                    cond[i][0] = this.cast(cond[i][0], dt.struct[i])
                    cond[i][1] = this.cast(cond[i][1], dt.struct[i])
                } else {
                    cond[i] = this.cast(cond[i], dt.struct[i])
                }
            }
        }
    }
    _insert(table, data) {
        var dt = this.data[table];
        var rowNum = dt.data.length;
        var r = [];
        var str = 'cookiebase_' + table + '_cc_' + rowNum + '_cc_';
        dt.data.push(r)
        for (var i in dt.struct) {
            r[i] = this.cast(data[i], dt.struct[i]);
            document.cookie = str + i + '=' + encodeURIComponent(r[i]) + ';' + this.append;
        }
        dt.tree.insert(r);
    }

    insert(table, data) {
        if (data[0]) data.forEach((d) => {
            this._insert(table, d)
        });
        else this._insert(table, data);
    }

    _delete(table, row) {
        var dt = this.data[table];
        var last = dt.data[dt.data.length - 1];
        var rowNum = dt.data.indexOf(row);
        var str = 'cookiebase_' + table + '_cc_';
        if (rowNum !== dt.data.length - 1) {
            var str2 = str + rowNum + '_cc_';
            for (var i in dt.struct) {
                document.cookie = str2 + i + '=' + encodeURIComponent(last[i]) + this.append;
            }
        }
        var str2 = str + (dt.data.length - 1) + '_cc_';
        for (var i in dt.struct) {
            document.cookie = str2 + i + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;' + this.append2;
        }

        dt.data[rowNum] = last;
        dt.data.pop();
        dt.tree.delete(row);
    }
    delete(table, where, func) {
        if (where) {
            this.apply(this.data[table], where);
            var arr = this.data[table].tree.get(where);
            arr.forEach((row) => {
                if (every(where, (val, key) => {
                        if (typeof val === 'object') {
                            return row[key] > val[0] && row[key] <= val[1];
                        } else {
                            return row[key] === val;
                        }
                    })) {
                    if (!func || func(row)) this._delete(table, row);
                }
            });
        } else {
            this.data[table].tree = new KDTree(Object.keys(this.data[table].struct));
            var str = 'cookiebase_' + table + '_cc_';
            this.data[table].deleted = 0;
            this.data[table].data.forEach((d, i) => {
                var g = str + i + '_cc_';
                d._TreeNode = null;
                for (var i in this.data[table].struct) {
                    document.cookie = g + i + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;' + this.append2;
                }
            });
            this.data[table].data = [];
        }
    }
    _update(table, row, rep) {
        var dt = this.data[table];
        var rowNum = dt.data.indexOf(row);
        var str = 'cookiebase_' + table + '_cc_' + rowNum + '_cc_';
        for (var i in dt.struct) {
            if (!rep[i]) continue;
            var res = this.cast(rep[i], dt.struct[i])
            document.cookie = str + i + '=' + encodeURIComponent(res);
            row[i] = res;
        }
        dt.tree.delete(row);
        dt.tree.insert(row);
    }
    update(table, data, where, func) {
        if (where) {
            this.apply(this.data[table], where);
            var arr = this.data[table].tree.get();
            arr.forEach((obj) => {
                if (every(where, (val, key) => {
                        if (typeof val === 'object') {
                            return obj[key] > val[0] && obj[key] <= val[1];
                        } else {
                            return obj[key] === val;
                        }
                    })) {
                    if (func) {
                        var r = func(obj);
                        if (r === true) {
                            this._update(table, obj, data);
                        } else
                        if (r !== undefined) {
                            this._update(table, obj, r);
                        }
                    } else this._update(table, obj, data);
                }
            });
        } else {
            this.data[table].tree = new KDTree(Object.keys(this.data[table].struct));
            this.data[table].data.forEach((s) => {
                this._update(table, s, data);
            });
        }
    }
    select(table, where, func) {
        if (where) {
            this.apply(this.data[table], where);
            var out = [];
            this.data[table].tree.query(where, (obj) => {
                var copy = {};
                if (every(where, (val, key) => {
                        if (typeof val === 'object' && obj[key] <= val[0] && obj[key] > val[1]) {
                            return false;
                        } else if (obj[key] !== val) {
                            return false;
                        }
                        copy[key] = this.decast(obj[key], this.data[table].struct[i]);
                        return true;
                    })) {
                    if (!func || func(copy)) out.push(copy);
                }
            })
            return out;
        } else {
            return this.data[table].data.map((row) => {
                var obj = {};
                for (var i in this.data[table].struct) {
                    if (i !== '_TreeNode') {
                        obj[i] = this.decast(row[i], this.data[table].struct[i]);
                    }
                }
                return obj;
            });
        }
    }
    query() {

    }
}
// BUILD BETWEEN
