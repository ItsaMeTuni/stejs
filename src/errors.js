const utils = require('./utils');

class StejsError extends Error {}

class UnclosedTagError extends StejsError
{
    constructor(tagIndexInSource, sourceTemplate, templatePath)
    {
        super(
            makeErrorMessage(
                `Missing $ character to close tag opened here`,
                tagIndexInSource,
                sourceTemplate,
                templatePath,
            )
        );
    }
}

class MissingEndTagError extends StejsError
{
    constructor(fragment, expectedEndTag, sourceTemplate, templatePath)
    {
        super(
            makeErrorMessage(
                `Missing expected ${expectedEndTag} tag to close the following ${fragment.type} tag`,
                fragment.positionInSource,
                sourceTemplate,
                templatePath,
            )
        );
    }
}

/**
 * Returns a string with a formatted error message along with a code snipped
 * indicating what originated the error.
 * 
 * Example:
 * message = 'An error occurred in this line'
 * tagIndexInSource = Index of the $ character in sourceTemplate
 * 
 * Output:
 * An error occurred in this line:
 * 72  |  <span>$an unclosed tag</span>
 *              ^
 * 
 * @param {String} message The message containing a description of the error
 * @param {Number} tagIndexInSource The position of the tag that caused the error
 * in the sourceTemplate string.
 * @param {String} sourceTemplate The source of the template that caused the error
 * @param {String} templatePath path of the template's file, doesn't need to be a valid path
 */
function makeErrorMessage(message, tagIndexInSource, sourceTemplate, templatePath = '')
{
    let {lineNumber, lineText, indexInLineText} = utils.getLineForIndex(tagIndexInSource, sourceTemplate);

    //We need this as a string later so we can use its length when calculating
    //some spacing for correct text alignment
    lineNumber = lineNumber.toString();

    let msg = `${message}:\n\n${templatePath}\n${lineNumber}  |  ${lineText}\n`;
    
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