'use strict';

module.exports = function(content, log) {
    let prepared_content = content;
    prepared_content = prepared_content.replaceAll(/(<br *\/>)([^\n])/ig, '$1\n$2');
    prepared_content = prepared_content.replaceAll(/(<\/div>)([^\n])/ig, '$1\n$2');
    prepared_content = prepared_content.replaceAll(/&lt;\?/ig, '&amp;#60;?');
    prepared_content = prepared_content.replaceAll(/\?&gt;/ig, '?&amp;#62;');
    prepared_content = prepared_content.replaceAll(/<(style\s?[^>]*)>/ig, '&lt;$1&gt;');
    prepared_content = prepared_content.replaceAll(/<(\/style)>/ig, '&lt;$1&gt;');
    prepared_content = prepared_content.replaceAll(/(<span\s+[^>]*class=[^>]*>)\n/ig, '$1!!!&#013;');
    prepared_content = prepared_content.replaceAll(/<(span\s+[^>]*class=[^>]*)>([^<]*)<(\/span)>/ig, '&lt;$1&gt;$2&lt;$3&gt;');
    prepared_content = prepared_content.replaceAll(/<(div\s+[^>]*style=[^>]*)>([^<]*)<(\/div)>/ig, '&lt;$1&gt;$2&lt;$3&gt;');
    if (log) {
        console.log(prepared_content);
    }
    return prepared_content;
}