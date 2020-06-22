const fs = require('fs');
const stejs = require('./stejs');

const inputStr = fs.readFileSync(__dirname + '/input.stejs').toString();
const context = {
    myVar: 'hello!',
    myList: ['simple', 'template', 'engine']
}

const output = stejs(inputStr, context);
console.log(output);