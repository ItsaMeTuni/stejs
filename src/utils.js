/**
 * Given an index in a string, this function finds out in which
 * line the index is, figures out the line's text and the "index of the index"
 * in the returned line text.
 * E.g.: index = 5, str = 'abc\ndef'
 * lineNumber = 2
 * lineText = 'def'
 * indexInLineText = 1
 * @param {Number} index 
 * @param {String} str 
 * @return {{
 *      lineNumber: Number,
 *      lineText: String,
 *      indexInLineText: Number,
 * }}
 */
function getLineForIndex(index, str)
{
    let lineNumber = 1;
    let lineText = '';

    //Count how many lines from the index to the start
    //of str
    //Also add str[index] and all characters that come before
    //it and are on the same line to lineText. lineText will
    //be populated in reverse order, we reverse it back to the
    //original order later on
    for(let i = index; i >= 0; i--)
    {
        if(str[i] == '\n')
        {
            lineNumber++;
        }

        if(lineNumber == 1)
        {
            lineText += str[i];
        }
    } 

    //Reverse lineText to original order since the last loop
    //populated it in the reverse order
    lineText = lineText.split('').reverse().join('');

    //The index of the character at str[index] in the lineText string
    //is the same as lineText's length minus 1, since its last character
    //is str[index]
    let indexInLineText = lineText.length - 1;

    //Add all characters after str[index] to lineText
    for(let i = index + 1; i < str.length; i++)
    {
        if(str[i] == '\n')
        {
            break;
        }
        else
        {
            lineText += str[i];
        }
    }

    return {lineNumber, lineText, indexInLineText};
}

module.exports = {
    getLineForIndex,
}