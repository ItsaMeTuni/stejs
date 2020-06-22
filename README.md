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