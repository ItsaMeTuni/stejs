const utils = require('./utils');

class StejsError extends Error {}

class UnclosedTagError extends StejsError
{
    constructor(tagIndexInSource, sourceTemplate)
    {
        super(
            makeErrorMessage(
                `Missing $ character to close tag opened here`,
                tagIndexInSource,
                sourceTemplate,
            )
        );
    }
}

class MissingEndTagError extends StejsError
{
    constructor(fragment, expectedEndTag, sourceTemplate)
    {
        super(
            makeErrorMessage(
                `Missing expected ${expectedEndTag} tag to close the following ${fragment.type} tag`,
                fragment.positionInSource,
                sourceTemplate,
            )
        );
    }
}


function makeErrorMessage(message, tagIndexInSource, sourceTemplate)
{
    let {lineNumber, lineText, indexInLineText} = utils.getLineForIndex(tagIndexInSource, sourceTemplate);

    //We need this as a string later so we can use its length when calculating
    //some spacing for correct text alignment
    lineNumber = lineNumber.toString();

    let msg = `${message}:\n\n${lineNumber}  |  ${lineText}\n`;
    
    //Add spaces to msg so that the ^ character aligns with the start of the tag
    //that caused the error.
    for(let i = 0; i < lineNumber.length + 5 + indexInLineText; i++)
    {
        msg += ' ';
    }

    msg += '^';

    //We add a \n to the start of the string because the every error message starts
    //with 'Error:' and that causes misalignment in the error message.
    return '\n' + msg;
}

module.exports = {
    StejsError,
    UnclosedTagError,
    MissingEndTagError,
}