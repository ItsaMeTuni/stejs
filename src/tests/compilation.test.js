const test = require('ava');
const rewire = require('rewire');
const fs = require('fs');
const path = require('path');

const stejs = rewire('../stejs');

test('Fragment extraction', t =>
{
    const template = fs.readFileSync(path.resolve(__dirname, 'test-template.html')).toString();

    const fragments = stejs.__get__('extractFragments')(template);

    const expectedFragments = [
        {
            type: 'text',
            value: '<html>\n    <h1>',
            children: [],
            parent: null,
        },
        {
            type: '',
            value: 'myVar',
            children: [],
            parent: null,
        },
        {
            type: 'text',
            value: '</h1>\n    ',
            children: [],
            parent: null,
        },
        {
            type: '',
            value: 'for i in myArr',
            children: [],
            parent: null,
        },
        {
            type: 'text',
            value: '\n    <span>',
            children: [],
            parent: null,
        },
        {
            type: '',
            value: 'i',
            children: [],
            parent: null,
        },
        {
            type: 'text',
            value: '</span>\n    ',
            children: [],
            parent: null,
        },
        {
            type: '',
            value: 'efor',
            children: [],
            parent: null,
        },
        {
            type: 'text',
            value: '\n</html>',
            children: [],
            parent: null,
        },
    ];

    for(const i in fragments)
    {
        t.truthy(
            fragments[i].type == expectedFragments[i].text
            || fragments[i].children == expectedFragments[i].children
            || fragments[i].value == expectedFragments[i].value
            || fragments[i].parent == expectedFragments[i].parent
        );
    }
});

test('Fragment extraction empty template', t =>
{
    const fragments = stejs.__get__('extractFragments')('');

    t.deepEqual(fragments, []);
});