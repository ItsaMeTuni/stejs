const utils = require('./utils');

class StejsError extends Error {}

class UnclosedTagError extends StejsError {}

class MissingEndTagError extends StejsError
{
    constructor(fragment, expectedEndTag, sourceTemplate)
    {
        let {lineNumber, lineText, indexInLineText} = utils.getLineForIndex(fragment.positionInSource, sourceTemplate);

        //We need this as a string later so we can use its length when calculating
        //some spacing for correct text alignment
        lineNumber = lineNumber.toString();

        let msg = `Missing expected ${expectedEndTag} tag to close the following ${fragment.type} tag:\n\n${lineNumber}  |  ${lineText}\n`;
        
        //Add spaces to msg so that the ^ character aligns with the start of the tag
        //that caused the error.
        for(let i = 0; i < lineNumber.length + 5 + indexInLineText; i++)
        {
            msg += ' ';
        }

        msg += '^';

        //We add a \n to the start of the string because the every error message starts
        //with 'Error:' and that causes misalignment in the error message.
        super('\n' + msg);
    }
}

module.exports = {
    StejsError,
    UnclosedTagError,
    MissingEndTagError,
}