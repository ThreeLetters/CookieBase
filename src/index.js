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
        this.initTables();
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
            var input = this.tables[i];
            var struct = [];
            var b = Object.keys(input);
            var indexes = {};
            var o = 0;
            b.sort();

            b.forEach((d) => {
                struct.push(input[d]);
                indexes[d] = o++;
            });
            this.data[i] = {
                name: i,
                struct: struct,
                indexes: indexes,
                sindexes: b,
                data: [],
                columnLen: b.length,
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
                var dt = this.data[table];

                var index = parseInt(a[1]);

                var row = Math.floor(index / dt.columnLen);
                var column = index % dt.columnLen;


                if (!this.data[table].data[row]) {
                    this.data[table].data[row] = [];
                    this.data[table].data[row].index = row;
                }
                this.data[table].data[row][column] = this.decast2(decodeURIComponent(s[1]), this.data[table].struct[column]);
            }
        })
    }

    finish() {

        for (var i in this.data) {
            var table = this.data[i];
            var Tree = new KDTree(table.columnLen);

            table.tree = Tree;

            table.data.forEach((row) => {
                Tree.insert(row);
            });
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
            var name = dt.sindexes[i];
            if (cond[name]) {
                var type = dt.struct[i]
                if (type === 'json' || type === 'rson') {
                    cond[name] = cond[i] = this.cast(cond[name], type)
                } else if (cond[name][0] && cond[name].length === 2) {
                    cond[i] = [];
                    cond[name][0] = cond[i][0] = this.cast(cond[name][0], type)
                    cond[name][1] = cond[i][1] = this.cast(cond[name][1], type)
                } else {
                    cond[name] = cond[i] = this.cast(cond[name], type)
                }
            }
        }
    }
    _insert(table, data) {
        var dt = this.data[table];
        var start = dt.data.length * dt.columnLen;
        var r = [];
        r.index = start;
        var str = 'cookiebase_' + table + '_cc_';
        dt.data.push(r)
        dt.struct.forEach((type, i) => {
            r[i] = this.cast(data[dt.sindexes[i]], type);
            document.cookie = str + (start + i) + '=' + encodeURIComponent(r[i]) + ';' + this.append;
        })
        dt.tree.insert(r);
    }

    insert(table, data) {
        if (data[0]) data.forEach((d) => {
            this._insert(table, d)
        });
        else this._insert(table, data);
    }

    deleteRow(table, row) {
        var dt = this.data[table];
        var lastIndex = dt.data.length - 1
        var last = dt.data[lastIndex];
        var rowNum = row.index;
        var str = 'cookiebase_' + table + '_cc_';
        if (rowNum !== lastIndex) {
            var start = rowNum * dt.columnLen;
            dt.struct.forEach((type, i) => {
                document.cookie = str + (start + i) + '=' + encodeURIComponent(last[i]) + this.append;
            });
            last.index = lastIndex;
        }
        var str2 = str + lastIndex + '_cc_';
        dt.struct.forEach((type, i) => {
            document.cookie = str + (start + i) + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;' + this.append2;
        });
        dt.data[rowNum] = last;
        dt.data.pop();
        dt.tree.delete(row);
    }
    delete(table, where, func) {
        var dt = this.data[table];
        if (where) {
            this.apply(dt, where);
            var arr = dt.tree.get(where);
            arr.forEach((row) => {
                if (every(where, (val, key) => {
                        if (typeof val === 'object') {
                            return row[dt.indexes[key]] > val[0] && row[dt.indexes[key]] <= val[1];
                        } else {
                            return row[dt.indexes[key]] === val;
                        }
                    })) {
                    if (!func || func(row)) this.deleteRow(table, row);
                }
            });
        } else {
            dt.tree = new KDTree(dt.columnLen);
            var str = 'cookiebase_' + table + '_cc_';
            dt.data.forEach((d, i) => {
                var g = i * dt.columnLen;
                d._TreeNode = null;
                dt.struct.forEach((type, i) => {
                    document.cookie = str + (g + i) + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;' + this.append2;
                })
            });
            dt.data = [];
        }
    }
    updateRow(table, row, rep) {
        var dt = this.data[table];
        var rowNum = dt.data.index;
        var str = 'cookiebase_' + table + '_cc_';
        var start = rowNum * dt.columnLen;
        dt.struct.forEach((type, i) => {
            if (!rep[dt.indexes[i]]) return;
            var res = this.cast(rep[dt.indexes[i]], type)
            document.cookie = str + (start + i) + '=' + encodeURIComponent(res);
            row[i] = res;
        })
        dt.tree.delete(row);
        dt.tree.insert(row);
    }
    update(table, data, where, func) {
        var dt = this.data[table]
        if (where) {
            this.apply(dt, where);
            var arr = dt.tree.get(where);
            arr.forEach((row) => {
                if (every(where, (val, key) => {
                        if (typeof val === 'object') {
                            return row[dt.indexes[key]] > val[0] && row[dt.indexes[key]] <= val[1];
                        } else {
                            return row[dt.indexes[key]] === val;
                        }
                    })) {
                    if (func) {
                        var r = func(row);
                        if (r === true) {
                            this.updateRow(table, row, data);
                        } else
                        if (r !== undefined) {
                            this.updateRow(table, row, r);
                        }
                    } else this.updateRow(table, row, data);
                }
            });
        } else {
            dt.tree = new KDTree(dt.columnLen);
            dt.data.forEach((row) => {
                row._TreeNode = null;
                this.updateRow(table, row, data);
            });
        }
    }
    select(table, where, func) {
        var dt = this.data[table];
        if (where) {
            this.apply(dt, where);
            var out = [];
            dt.tree.query(where, (row) => {

                if (every(where, (val, key) => {
                        if (typeof val === 'object') {
                            if (row[dt.indexes[key]] <= val[0] || row[dt.indexes[key]] > val[1]) {
                                return false;
                            }
                        } else if (row[dt.indexes[key]] !== val) {
                            return false;
                        }
                        return true;
                    })) {
                    var copy = {};

                    row.forEach((it, i) => {
                        copy[dt.sindexes[i]] = this.decast(it, dt.struct[i])
                    })

                    if (!func || func(copy)) out.push(copy);
                }
            })
            return out;
        } else {
            return dt.data.map((row) => {
                var copy = {};
                dt.struct.forEach((type, i) => {
                    copy[dt.sindexes[i]] = this.decast(row[i], dt.struct[i]);
                })
                return copy;
            });
        }
    }
}
// BUILD BETWEEN
