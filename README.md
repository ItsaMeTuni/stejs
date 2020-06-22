# STEJS - Simple Template Engine for JavaScript


Syntax example:
```
$myVar$

$for item of myList$
    $item$
$efor$

$for i in myList$
    $myList[i]$
$efor$

$if myVar == 'henlo'$
    hi!
$fi$
```

Only for loops (for in or for of) and ifs are supported at the moment.

## Usage

```
const fs = require('fs');
const stejs = require('stejs');

const inputStr = fs.readFileSync(__dirname + '/input.stejs').toString();
const context = {
    myVar: 'hello!',
    myList: ['simple', 'template', 'engine']
}

const output = stejs(inputStr, context);
console.log(output);
```

input.stejs:
```
$myVar$

$for item of myList$
$item$
$efor$

$for i in myList$
$i$ -> $myList[i]$
$efor$

$if myVar == 'henlo'$
hi!
$fi$
```


Output:
```
hello!


simple

template

engine



0 -> simple

1 -> template

2 -> engine




```