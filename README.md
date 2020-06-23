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

Take a look at includes!
$include('path-to-my-file')$
```

Only for loops (for in or for of) and ifs are supported at the moment.

## Usage

```
const fs = require('fs');
const stejs = require('stejs');

const inputStr = fs.readFileSync(__dirname + '/input.txt').toString();
const context = {
    myVar: 'hello!',
    myList: ['simple', 'template', 'engine']
}

const output = stejs(inputStr, context);
console.log(output);
```

input.txt:
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

## Template files

STEJS templates can have any file extension, as long as they are plain text files.

## Includes

Includes are a simple way of, well, including templates in other templates. When the template engine is run the include tags are just replaced with the contents of the included template. The context of the included template is the same context of the include tag that included it.

To include a template just `$include('path')$`. The path is relative to where STEJS is running.