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
var version = "0.1.0";
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!

var yyyy = today.getFullYear();
if (dd < 10) {
    dd = '0' + dd;
}
if (mm < 10) {
    mm = '0' + mm;
}
var date = dd + '/' + mm + '/' + yyyy;


var fs = require('fs');


var index = fs.readFileSync(__dirname + '/src/index.js', 'utf8').split('// BUILD BETWEEN')[1];
var util = fs.readFileSync(__dirname + '/src/Util.js', 'utf8').split('// BUILD BETWEEN')[1];
var rson = fs.readFileSync(__dirname + '/src/lib/RSON.js', 'utf8').split('// BUILD BETWEEN')[1];
var KDTree = fs.readFileSync(__dirname + '/src/lib/KDTree.js', 'utf8').split('// BUILD BETWEEN')[1];


var final = `"use strict";\n\
/*\n\
 Author: Andrews54757\n\
 License: MIT (https://github.com/ThreeLetters/CookieBase/blob/master/LICENSE)\n\
 Source: https://github.com/ThreeLetters/CookieBase\n\
 Build: v${version}\n\
 Built on: ${date}\n\
*/\n\
${util}\
${rson}\
${KDTree}\
${index}`;


fs.writeFileSync(__dirname + '/build/CookieBase.js', final);
