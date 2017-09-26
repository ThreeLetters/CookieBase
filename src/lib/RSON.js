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
// BUILD BETWEEN
