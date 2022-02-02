'use strict';

module.exports = function(md, log) {
    let result_md = md;
    result_md = result_md.replaceAll(/\n\s*\n\s*\n/ig, '\n\n');
    if (log) {
        console.log(result_md);
    }
    return result_md;
}