# STEJS - Simple Template Engine for JavaScript

`npm install --save stejs`

There is a webpack loader for this: [stejs-loader](https://github.com/ItsaMeTuni/stejs-loader.git).

## Usage

```js
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

`input.txt`:
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

## Syntax

STEJS tags are limited by two `$`, everything in between that is processed by STEJS. Depending on the structure of the content in the tag it will have a different behavior.

### Expressions

Expressions in STEJS are evaluated and the result is converted to a string and pasted in the place of the tag.

Template:
```html
<h1>$ 1 + 2 + 3 * 5$</h1>
```

Output:
```html
<h1>18</h1>
```

### For loops

If the content of the tag matches a for loop it will repeat everything between it and a `$efor$` tag. You can use either `for of` loops or `for in` loops. While loops are not supported yet.

Template:
```html
<div>
    $for el of ['some', 'text', 'here']$
    <p></p>
    $efor$
</div>
```

Output:
```html
<div>
    <p>some</p>
    <p>text</p>
    <p>here</p>
</div>
```

### If statements

If the content of the tag matches the structure of an if statement everything between it and its `$fi$` ending tag will only be rendered in the output if the result of the expression in the if statement is true.

Template:
```html
$if 1 + 2 == 3$
<input type="button" />
$fi$
```

Output:
```html
<input type="button" />
```

Parentheses are not needed. Else and else if statements are not supported yet.

### Includes

Includes are a simple way of, well, including templates in other templates. When the template engine is run the include tags are just replaced with the contents of the included template. The context of the included template is the same context of the include tag that included it.

To include a template just `$include('path')$`.

Template:
```html
<div class="content">
    Some content here blah blah blah
</div>
$include('src/footer.html')$
```

`src/footer.html`:
```html
<div class="footer">
    Some footer info
</div>
```

Output:
```html
<div class="content">
    Some content here blah blah blah
</div>
<div class="footer">
    Some footer info
</div>
```

The path is relative to where STEJS is running.

## Template files

STEJS templates can have any file extension, as long as they are plain text files.