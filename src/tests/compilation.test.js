const test = require('ava');
const rewire = require('rewire');
const fs = require('fs');
const path = require('path');

const stejs = rewire('../stejs');
const errors = require('../errors');

test('Fragment extraction', t =>
{
    const template = fs.readFileSync(path.resolve(__dirname, 'compilation-test-template.html')).toString();

    const fragments = stejs.__get__('extractFragments')(template);

    const expectedFragments = intoFragments([
        {
            type: 'text',
            value: '<html>\n    <h1>',
            children: [],
            positionInSource: 0,
        },
        {
            type: '',
            value: 'myVar',
            children: [],
            positionInSource: 15,
        },
        {
            type: 'text',
            value: '</h1>\n    ',
            children: [],
            positionInSource: 22,
        },
        {
            type: '',
            value: 'for i in myArr',
            children: [],
            positionInSource: 32,
        },
        {
            type: 'text',
            value: '\n    <span>',
            children: [],
            positionInSource: 48,
        },
        {
            type: '',
            value: 'i',
            children: [],
            positionInSource: 59,
        },
        {
            type: 'text',
            value: '</span>\n    ',
            children: [],
            positionInSource: 62,
        },
        {
            type: '',
            value: 'efor',
            children: [],
            positionInSource: 74,
        },
        {
            type: 'text',
            value: '\n</html>',
            children: [],
            positionInSource: 80,
        },
    ]);
    t.deepEqual(fragments, expectedFragments);
});

test('Fragment extraction empty template', t =>
{
    const fragments = stejs.__get__('extractFragments')('');

    t.deepEqual(fragments, []);
});

test('Missing tag terminator', t =>
{
    t.throws(() =>
    {
        stejs.__get__('extractFragments')('$myVar');
    },
    {
        instanceOf: errors.UnclosedTagError,
    });
});

test('Missing end tag', t =>
{
    t.throws(() =>
    {
        const fragments =  [
            {
                type: 'if',
                value: 'false == true',
            },
        ];
        stejs.__get__('createFragmentRelations')(fragments, '$if false == true$');
    },
    {
        instanceOf: errors.MissingEndTagError,
    });
});

test('Fragment relations', t =>
{
    const fragments = intoFragments([
        {
            type: 'text',
            value: 'abcd\n',
        },
        {
            type: 'if',
            value: 'true == false',
        },
        {
            type: 'text',
            value: 'efgh\n',
        },
        {
            type: 'fi',
            value: '',
        },
        {
            type: 'text',
            value: 'ijkl\n',
        },
    ]);

    const result = stejs.__get__('createFragmentRelations')(fragments, '$if false == true$');

    const expectedResult = intoFragments([
        {
            type: 'text',
            value: 'abcd\n',
        },
        {
            type: 'if',
            value: 'true == false',
            children: intoFragments([
                {
                    type: 'text',
                    value: 'efgh\n',
                },
            ]),
        },
        {
            type: 'text',
            value: 'ijkl\n',
        },
    ]);


    t.deepEqual(result, expectedResult);
});

function intoFragments(arr)
{
    const Fragment = stejs.__get__('Fragment');
    let a = arr.map(x => Object.assign(new Fragment(), x));

    return a;
}