"use strict";
/*
 Author: Andrews54757
 License: MIT (https://github.com/ThreeLetters/CookieBase/blob/master/LICENSE)
 Source: https://github.com/ThreeLetters/CookieBase
 Build: v0.1.0
 Built on: 27/09/2017
*/

function every(obj, call) {
    for (var i in obj) {
        if (!call(obj[i], i)) return false;
    }
    return true;
}

var RSON = {
    stringify: function (object) {
        var OBJ_SEEN = [],
            ARR_SEEN = [];

        function escape(str) {
            return str.replace(/[{}|\\]/g, '\\$&');
        }

        function recurse(object) {

            if (object === null) {
                return 'l';
            } else if (typeof object === 'object') {
                var out = [];
                if (object.constructor === Array) { // array
                    var ind = ARR_SEEN.indexOf(object);
                    if (ind != -1) return 'a' + ind;
                    ARR_SEEN.push(object);
                    for (var i = 0; i < object.length; ++i) {
                        out.push(recurse(object[i]));
                    }
                    return '{' + out.join('|') + (((object.length - 1) & 1) ? '|' : '') + '}';
                } else { // object
                    var ind = OBJ_SEEN.indexOf(object);
                    if (ind != -1) return 'o' + ind;
                    OBJ_SEEN.push(object);
                    var out2 = [];
                    for (var i in object) {
                        out.push(recurse(object[i]));
                        out2.push(i);
                    }
                    return '{' + out.join('|') + '|' + out2.join('|') + '}';
                }

            } else if (typeof object === 'string') {
                return 's' + escape(object);
            } else if (typeof object === 'number') {
                return 'n' + object;
            } else if (typeof object === 'undefined') {
                return 'u';
            }

        }
        return recurse(object)
    },
    parse: function (string) {
        var OBJ_DICT = [];
        var ARR_DICT = [];

        function unescape(str) {
            return str.replace(/\\(.)/g, '$1');
        }

        function cast(sc) {
            switch (sc[0]) {
                case 's':
                    return unescape(sc.slice(1).join(''));
                    break;
                case 'n':
                    return parseFloat(sc.slice(1).join(''));
                    break;
                case 'u':
                    return undefined;
                    break;
                case 'l':
                    return null;
                    break;
                case 'o':
                    return OBJ_DICT[parseInt(sc.slice(1).join(''))]
                    break;
                case 'a':
                    return ARR_DICT[parseInt(sc.slice(1).join(''))]
                    break;
            }
        }

        function recurse(str) {

            if (str[0] !== '{') {
                return cast(str);
            }
            str = str.slice(1, str.length - 1);
            var i = 0,
                len = str.length,
                current = [],
                split = [];

            for (; i < len; ++i) {
                switch (str[i]) {
                    case '\\':
                        current.push('\\', str[++i]);
                        break;
                    case '{':
                        current.push('{');
                        var lvl = 1;
                        for (++i; i < len; i++) {
                            current.push(str[i]);
                            if (str[i] === '\\') {
                                current.push(str[++i]);
                            } else
                            if (str[i] === '{') {
                                lvl++;
                            } else if (str[i] === '}') {
                                lvl--;
                                if (lvl === 0) break;
                            }
                        }
                        break;
                    case '|':
                        split.push(current);
                        current = [];
                        break;
                    default:
                        current.push(str[i]);
                        break;
                }
            }

            split.push(current);
            if (split.length & 1) {
                var array = [];
                ARR_DICT.push(array);

                for (var i = 0; i < split.length; i++) {
                    if (split[i][0] !== undefined) array.push(recurse(split[i]));
                }
                return array;
            } else {
                var object = {};
                OBJ_DICT.push(object);
                var half = split.length / 2;
                for (var i = 0; i < half; ++i) {
                    object[split[i + half].join('')] = recurse(split[i]);
                }
                return object;
            }
        }
        return recurse(string.split(''));
    }
}

var MAX_NODES = 4;

class KDTree {
    constructor(dims) {
        this.root = {
            left: null,
            right: null,
            split: null,
            nodes: [],
            dim: 0,
            lvl: 0,
            len: 0,
            add: function () {
                ++this.len;
            },
            sub: function () {
                --this.len;
            }
        }
        this.dims = dims;
    }
    insert(obj) {
        var len = this.dims;

        var recurse = function (node) {
            if (node.left) {
                recurse((obj[node.dim] > node.split) ? node.right : node.left);
            } else {
                node.nodes.push(obj);
                obj._TreeNode = node;
                node.add();

                if (node.nodes.length >= MAX_NODES && (node.nodes.length % 2 === 0)) {
                    node.nodes.sort(function (a, b) {
                        return a[node.dim] - b[node.dim];
                    }.bind(this))

                    var len = node.nodes.length;
                    var half = len / 2;
                    var median = node.nodes[half - 1][node.dim];
                    var median2 = node.nodes[half][node.dim];
                    if (typeof median === "number" && typeof median2 === "number") median = Math.floor((median + median2) / 2)

                    if (node.nodes[len - 1][node.dim] === median) {
                        return;
                    }

                    node.split = median;


                    node.left = {
                        nodes: [],
                        dim: (node.lvl + 1) % len,
                        lvl: node.lvl + 1,
                        len: half,
                        parent: node,
                        add: function () {
                            ++this.len;
                            this.parent.add();
                        },
                        sub: function () {
                            --this.len;
                            this.parent.sub();
                        }
                    }
                    for (let i = 0; i < half; ++i) {
                        node.left.nodes.push(node.nodes[i])
                        node.nodes[i]._TreeNode = node.left;
                    }
                    node.right = {
                        nodes: [],
                        dim: (node.lvl + 1) % len,
                        lvl: node.lvl + 1,
                        parent: node,
                        len: half,
                        add: function () {
                            ++this.len;
                            this.parent.add();
                        },
                        sub: function () {
                            --this.len;
                            this.parent.sub();
                        }
                    }
                    for (let i = half; i < len; ++i) {
                        node.right.nodes.push(node.nodes[i])
                        node.nodes[i]._TreeNode = node.right;
                    }
                    node.nodes = [];
                }
            }
        }.bind(this);
        recurse(this.root);
    }
    delete(obj) {
        if (!obj._TreeNode) return;
        var node = obj._TreeNode;

        var ind = node.nodes.indexOf(obj);

        node.nodes[ind] = node.nodes[node.nodes.length - 1];
        node.nodes.pop();
        node.sub();

        var getAll = function (node, call) {
            if (node.left) {
                getAll(node.left, call)
                getAll(node.right, call)
            } else node.nodes.forEach(call);
        }
        var recurse = function (node) {
            if (node.parent && (node.parent.left.len + node.parent.right.len) <= MAX_NODES) {
                getAll(node.parent, function (o) {
                    o._TreeNode = node.parent;
                    node.parent.nodes.push(o);
                });

                node.parent.left = node.parent.right = null
                recurse(node.parent);
            }
        }
        recurse(node)
    }
    query(obj, call) {
        var recurse = function (node) {
            if (node.left) {
                var val = obj[node.dim];
                if (val === undefined) {
                    recurse(node.left);
                    recurse(node.right);
                } else if (typeof val !== 'object') {
                    recurse(val > node.split ? node.right : node.left)
                } else {
                    var min = val[0];
                    var max = val[1];

                    if (min > node.split) recurse(node.right);
                    else if (max <= node.split) recurse(node.left);
                    else {
                        recurse(node.left);
                        recurse(node.right);
                    }
                }
            } else {
                node.nodes.forEach(call);
            }
        }.bind(this);
        recurse(this.root)
    }
    get(obj) {
        var out = [];
        this.query(obj, (node) => {
            out.push(node);
        })
        return out;
    }

}

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
            if (cond[i]) {
                var type = dt.struct[dt.indexes[i]]
                if (type === 'json' || type === 'rson') {
                    cond[i] = this.cast(cond[i], type)
                } else if (cond[i][0] && cond.length === 2) {
                    cond[i][0] = this.cast(cond[i][0], type)
                    cond[i][1] = this.cast(cond[i][1], type)
                } else {
                    cond[i] = this.cast(cond[i], type)
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
            if (!rep[dt.indexes[i]]) continue;
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
            var arr = dt.tree.get();
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
                var copy = {};
                if (every(where, (val, key) => {
                        if (typeof val === 'object' && row[dt.indexes[key]] <= val[0] && row[dt.indexes[key]] > val[1]) {
                            return false;
                        } else if (row[dt.indexes[key]] !== val) {
                            return false;
                        }
                        copy[key] = this.decast(row[dt.indexes[key]], dt.struct[i]);
                        return true;
                    })) {
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
