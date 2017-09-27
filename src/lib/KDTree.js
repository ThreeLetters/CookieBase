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
// BUILD BETWEEN
