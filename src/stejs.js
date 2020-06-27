const cloneDeep = require('clone-deep');
const Path = require('path');
const fs = require('fs');
const errors = require('./errors');

/**
 * Defines a fragment of a template. This is used to break a template
 * down into an array of nested Fragments, which is then used to process
 * the template.
 */
class Fragment
{
    constructor()
    {
        //text, expression, for, efor, if, fi
        this.type = '';
        this.value = null;
        this.children = [];
        this.parent = null;
    }
}

/**
 * Represents a compiled template.
 */
class CompiledTemplate
{
    /**
     * @param {Fragment[]} fragments
     * @param {String} source
     */
    constructor(fragments, source)
    {
        /** @type {Fragment[]} */
        this.fragments = fragments;

        /** @type {String} the template string that was compiled into this object */
        this.source = source;
    }
}

class FragmentRelationsRecursionPayload
{
    constructor(obj)
    {
        /** @type {String} */
        this.endFragmentToSearchFor;

        /** @type {Fragment} */
        this.parent;
    }
}

class FragmentRelationsReturn
{
    constructor(obj)
    {
        /** @type {Fragment[]} */
        this.fragments;

        /** @type {Boolean} */
        this.foundEndFragment;
    }
}

/**
 * Some utility functions and values that can be used in the templates.
 * The first argument of functions are the context, which is bound to calls to them
 * automatically by stejs. See {@link addUtilsToContext}.
 */
const contextUtils =
{
    /**
     * Includes a template into another.
     * Since this is a function that is called by expression tags, we just returns a string with
     * the processed template. The returned string will then be incorporated into the parent
     * template, just like with any other expression tag result.
     * @param {Object} context The context object
     * @param {String} relativePath Path to the template to include, relative to where stejs is running
     */
    include(context, relativePath)
    {
        const path = Path.resolve(__dirname, relativePath);
        const str = fs.readFileSync(path).toString();
    
        return processTemplate(str, context);
    },
};

/**
 * Processes an input string with STEJS.
 * @param {String | CompiledTemplate} template a template string or a CompiledTemplate
 * @param {Object} context a context object with any variables you want to access
 * from within the template
 * @returns {String} the processed template
 */
function processTemplateSingle(template, context)
{
    let fragments;

    if(typeof template == 'string')
    {
        fragments = compileTemplate(template).fragments;
    }
    else if (template instanceof CompiledTemplate)
    {
        fragments = template.fragments;
    }
    else
    {
        throw new Error('template must be either a CompiledTemplate or a template string!');
    }

    context = addUtilsToContext(context, contextUtils);

    fragments = executeFragments(fragments, context);

    const out = constructOutput(fragments);
    return out;
}

/**
 * Processes an input string with STEJS multiple times. Use this if you have
 * a single template that needs to generate more than one page, as this method will
 * compile the template once and execute it with many contexts.
 * @param {String | CompiledTemplate} template a template string or a CompiledTemplate to process
 * @param {Object[]} contexts an array of context objects with any variables you want to access
 * from within the template
 * @returns {String[]} an array of versions of the processed template, each with its
 * own context and in the same order as the contexts parameter
 */
function processTemplateMany(template, contexts)
{
    let fragments = template;
   
    if(typeof template == 'string')
    {
        fragments = compileTemplate(template).fragments;
    }
    else if (template instanceof CompiledTemplate)
    {
        fragments = template.fragments;
    }
    else
    {
        throw new Error('template must be either a CompiledTemplate or a template string!');
    }

    if (typeof contexts != 'array')
    {
        throw new Error('Context must be an array of objects!');
    }

    const outputs = [];

    for(const i in contexts)
    {
        if(typeof contexts[i] != 'object')
        {
            throw new Error('Context must be an array of objects!');
        }

        contexts[i] = addUtilsToContext(contexts[i], contextUtils);
        const executedFragments = executeFragments(fragments, contexts[i]);

        outputs.push(constructOutput(executedFragments));
    }

    return outputs;
}

/**
 * Compiles a template into an array of fragments
 * @param {String} template template string to compile
 * @returns {CompiledTemplate} array of fragments representing the compiled template
 */
function compileTemplate(template)
{
    let fragments = extractFragments(template);
    fragments = classifyFragments(fragments);
    fragments = createFragmentRelations(fragments);

    return new CompiledTemplate(fragments, template);
}

/**
 * This function takes an array of fragments and classifies them based on
 * the role they play in the template. Fragments that match a for loop regex
 * will be given a 'for' type, fragments that match an if loop regex will be
 * given an 'fi' type, etc.
 * This function might alter the value of the fragments.
 * Fragments that already have defined types are kept untouched.
 * @param {Fragment[]} fragments fragments to be classified
 */
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
        const forloop = /^ *for *(\S*) *(in|of) +(.*)$/gm.exec(fragment.value);
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

/**
 * Configures relationships between fragments. E.g. all fragments
 * between a 'for' fragment and an 'efor' fragment are all moved into
 * the children field of the 'for' fragment (and the 'efor' fragment is destroyed).
 * @param {Fragment[]} fragments Array of fragments to analyze and configure the relationships
 */
function createFragmentRelations(fragments)
{
    return _createFragmentRelations(fragments).fragments;
}

/**
 * @param {Fragment[]} fragments Fragments to figure out the relationships
 * @param {FragmentRelationsRecursionPayload} recursionPayload
 * @returns {FragmentRelationsReturn}
 */
function _createFragmentRelations(fragments, recursionPayload = null)
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
            const subresult = _createFragmentRelations(fragments.slice(1), {
                parentFragment: fragment,
                endFragmentToSearchFor: endTag,
            });
            if(subresult.foundEndFragment)
            {
                fragment.children.push(...subresult.result);

                //Remove all found children + end tag from the fragments array so we don't
                //loop over them (end tag is not returned by _createFragmentRelations, but we know
                //it's the next element in the fragments array, so just add 1 to the amount of elements
                //to remove)
                fragments.splice(1, subresult.result.length + 1);
            }
            else
            {
                throw new errors.MissingEndTagError(parentFragment, recursionPayload.endFragmentToSearchFor);
            }
        }

        fragments.splice(0, 1);

        if(fragment.type == recursionPayload.endFragmentToSearchFor)
        {
            return {fragments: result, foundEndFragment: true};
        }

        result.push(fragment);
    }

    return {fragments: result, foundEndFragment: false};
}

/**
 * Runs the code in all non-text fragments. Expression fragments
 * are replaced by text fragments containing the result of the expression.
 * Loop fragments will be replaced with all children generated by the loop.
 * If fragments will be replaced with their children if the expression evaluates to true,
 * or are destroyed if the expression evaluates to false.
 * @param {Fragment[]} fragments list of fragments to execute
 * @param {Object} context the context object to be used when {@link execExprInContext} is called for the fragments
 */
function executeFragments(fragments, context)
{
    fragments = cloneDeep(fragments);

    const result = [];

    for(let i = 0; i < fragments.length; i++)
    {
        const fragment = fragments[i];
        
        if(fragment.type == 'expression')
        {
            const textFragment = new Fragment();
            textFragment.type = 'text';
            textFragment.value = execExprInContext(fragment.value, context);

            result.push(textFragment);
        }

        if(fragment.type == 'for')
        {
            const iterable = execExprInContext(fragment.value.iterable, context);
            for(const x in iterable)
            {
                if(fragment.value.forType == 'in')
                {
                    context[fragment.value.varName] = x;
                }
                else
                {
                    context[fragment.value.varName] = iterable[x];
                    
                }
                result.push(...executeFragments(fragment.children, context));
            }
            context[fragment.value.varName] = undefined;
        }

        if(fragment.type == 'if')
        {
            const exprResult = execExprInContext(fragment.value, context);
            if(exprResult)
            {
                result.push(...executeFragments(fragment.children, context));
            }
        }

        if(fragment.type == 'text')
        {
            result.push(fragment);
        }
    }

    return result;
}

/**
 * Assigns all fields of utils to context but with extra steps.
 * Creates __context__ field in context with a reference to itself.
 * Functions in utils are wrapped with an automatic binding of context to calls
 * to them, so their context parameter doesn't need to be specified by the user
 * in the template that calls the function.
 * @param {Object} context context to which you want to add the utils
 * @param {Object} utils an object containing utility functions and fields
 */
function addUtilsToContext(context, utils)
{
    //Create a circular ref so we can access the context
    //object in utils functions (or, if for some reason
    //we need to, access it in the template)
    context.__context__ = context;

    //Add stuff from utils to context
    for(const name in utils)
    {
        if(typeof utils[name] == 'function')
        {
            //utils functions have a context parameter, so we bind it here
            //so that we don't need to do that in the template
            context[name] = (...x) => utils[name].bind(null, context, ...x)();
        }
        else
        {
            context[name] = utils[name];
        }
    }

    return context;
}

/**
 * Executes a javascript string. All fields in the context
 * object are exposed as variables to the code in exprStr.
 * @param {String} exprStr the code to execute
 * @param {Object} context the context object
 * @returns {*} The result of the expression executed
 */
function execExprInContext(exprStr, context)
{   
    return Function(...Object.keys(context), 'return '+ exprStr)(...Object.values(context));
}

/**
 * Generates a string from an array of text fragments by concatenating their values.
 * All of the fragments have to be text fragments, otherwise an exception will be thrown.
 * @param {Fragment[]} fragments the fragments used to construct the output of the function
 * @returns {String}
 */
function constructOutput(fragments)
{
    let outStr = '';
    
    for(const fragment of fragments)
    {
        if(fragment.type != 'text')
        {
            throw new Error('A non-text fragment got through to the output construction phase!', fragment, fragments);
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
    
    if(str.length == 0)
    {
        return [];
    }

    let lookingForClosingTag = false;
    for(let i = 0; i < str.length; i++)
    {
        if(str[i] == '$')
        {
            if(lookingForClosingTag)
            {
                const lastMatch = results[results.length - 1];
                lastMatch.fullMatch = str.substring(lastMatch.index, i + 1);
                lastMatch.content = str.substring(lastMatch.index + 1, i);
                lookingForClosingTag = false;
            }
            else
            {
                results.push({
                    index: i,
                });

                lookingForClosingTag = true;
            }
        }
    }

    if(lookingForClosingTag)
    {
        throw new errors.UnclosedTagError('Missing tag end character $');
    }

    const firstFragment = new Fragment();
    firstFragment.type = 'text';
    if(results.length > 0)
    {
        firstFragment.value = str.substring(0, results[0].index);
    }
    else
    {
        firstFragment.value = str;
    }

    results.splice(0, 0, firstFragment);

    //Transform regex results into fragments
    //and create fragments for the text results
    for(let i = 1; i < results.length; i += 2)
    {
        const textFragment = new Fragment();
        textFragment.type = 'text';

        if(results[i+1] != null)
        {
            
            textFragment.value = str.substring(results[i].index + results[i].fullMatch.length, results[i+1].index);
            results.splice(i+1, 0, textFragment);
        }
        else
        {
            textFragment.value = str.substring(results[i].index + results[i].fullMatch.length, str.length);
            results.push(textFragment);
        }

        const frag = new Fragment();
        frag.value = results[i].content;
        results[i] = frag;
    }

    return results;
}

module.exports = { 
    processTemplateSingle,
    processTemplateMany,
    compileTemplate,
};