const fs = require('fs');
const cloneDeep = require('clone-deep');

class Fragment
{
    constructor()
    {
        //text, expression or control
        this.type = '';
        this.value = null;
        this.payload = null;
        this.children = [];
        this.parent = null;
    }
}

const input = fs.readFileSync(__dirname + '/input.stejs').toString();

let allFragments = extractFragments(input);
allFragments = classifyFragments(allFragments);
allFragments = createFragmentRelations(allFragments).result;
allFragments = executeFragments(allFragments, {myVar: 'henlo', myList: ['wussup']});

const out = constructOutput(allFragments);
console.log(out);


function classifyFragments(fragments)
{
    fragments = cloneDeep(fragments);
    
    for(const fragment of fragments)
    {
        if(fragment.type != '')
        {
            continue;
        }

        //for in/of
        const forloop = /^ *for *(\S*) *(in|of) *(\S*)$/gm.exec(fragment.value);
        if(forloop)
        {   
            fragment.type = 'for';
            fragment.value = {
                varName: forloop[1],
                forType: forloop[2],
                iterable: forloop[3],
            };
    
            continue;
        }

        //efor
        const endfor = /^ *efor *$/gm.exec(fragment.value);
        if(endfor)
        {
            fragment.type = 'efor';
            fragment.value = null;

            continue;
        }

        //if
        const ifCond = /^ *if (.*)$/gm.exec(fragment.value);
        if(ifCond)
        {
            fragment.type = 'if';
            fragment.value = ifCond[1];

            continue;
        }

        //fi
        const fi = /^ *fi *$/gm.exec(fragment.value);
        if(fi)
        {
            fragment.type = 'fi';
            fragment.value = null;

            continue;
        }

        //If nothing else worked it's just an expression
        fragment.type = 'expression';
    }

    return fragments;
}

function createFragmentRelations(fragments, stopFragment = null)
{
    const result = [];
    fragments = cloneDeep(fragments);

    //This loop consumes the array by removing element at index 0
    //every iteration. This will move all fragments between a control
    //tag and it's respective end tag into the control tag's children
    //array.
    while(fragments.length > 0)
    {
        const fragment = fragments[0];

        if(fragment.type == 'for' || fragment.type == 'if')
        {
            let endTag = '';
            switch(fragment.type)
            {
                case 'for': endTag = 'efor'; break;
                case 'if': endTag = 'fi'; break;
            }

            //Get all fragments until next efor tag and set them as
            //this fragment's children
            const subresult = createFragmentRelations(fragments.slice(1), endTag);
            if(subresult.foundStopFrag)
            {
                fragment.children.push(...subresult.result);

                //Remove all found children + end tag from the fragments array so we don't
                //loop over them (end tag is not returned by createFragmentRelations, but we know
                //it's the next element in the fragments array, so just add 1 to the amount of elements
                //to remove)
                fragments.splice(1, subresult.result.length + 1);
            }
            else
            {
                console.error('didnt find an end tag for tag of type: ', fragment.type);
            }
        }

        fragments.splice(0, 1);

        if(fragment.type == stopFragment)
        {
            return {result, foundStopFrag: true};
        }

        result.push(fragment);
    }

    return {result, foundStopFrag: false};
}

function executeFragments(fragments, context)
{
    fragments = cloneDeep(fragments);

    for(let i = 0; i < fragments.length; i++)
    {
        const fragment = fragments[i];
        
        if(fragment.type == 'expression')
        {
            fragment.type = 'text';
            fragment.value = execExprInContext(fragment.value, context);
        }

        if(fragment.type == 'for')
        {
            const iterable = execExprInContext(fragment.value.iterable, context);
            for(const x of iterable)
            {
                context[fragment.value.varName] = x;
                fragments.splice(i, 1, ...executeFragments(fragment.children, context));
            }

            context[fragment.value.varName] = undefined;
        }

        if(fragment.type == 'if')
        {
            const exprResult = execExprInContext(fragment.value, context);
            if(exprResult)
            {
                fragments.splice(i, 1, ...executeFragments(fragment.children, context));
            }
            else
            {
                fragments.splice(i, 1);
            }
        }
    }

    return fragments;
}

function execExprInContext(exprStr, context)
{   
    return Function(...Object.keys(context), 'return '+ exprStr)(...Object.values(context));
}

function constructOutput(fragments)
{
    let outStr = '';
    
    for(const fragment of fragments)
    {
        if(fragment.type != 'text')
        {
            console.error('A non-text fragment got through to the output construction phase!', fragment, fragments);
        }

        outStr += fragment.value;
    }

    return outStr;
}

/**
 * Extract fragments from a string. Tag fragments don't have a specified type,
 * plain text fragments have the text type.
 * @param {String} str 
 * @returns {Fragment[]} Array of extracted fragments
 */
function extractFragments(str)
{
    let results = [];
    
    const regex = /\$(.*)\$/gm;

    do
    {
        results.push(regex.exec(str));
    }
    while(results[results.length - 1])

    results = results.splice(0, results.length - 1);

    const firstFragment = new Fragment();
    firstFragment.type = 'text';
    firstFragment.value = str.substring(0, results[0].index);

    results.splice(0, 0, firstFragment);

    //Transform regex results into fragments
    //and create fragments for the text results
    for(let i = 1; i < results.length; i += 2)
    {
        const textFragment = new Fragment();
        textFragment.type = 'text';

        if(results[i+1] != null)
        {
            
            textFragment.value = str.substring(results[i].index + results[i][0].length, results[i+1].index);
            results.splice(i+1, 0, textFragment);
        }
        else
        {
            textFragment.value = str.substring(results[i].index + results[i][0].length, str.length);
            results.push(textFragment);
        }

        const frag = new Fragment();
        frag.value = results[i][1];
        results[i] = frag;
    }

    return results;
}