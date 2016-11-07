/*
 * spot check that each language has values for the string id keys on Wedo2 page
 * that are contained in English (i.e. make sure strings will show up, not ids")
 */
var merge = require('lodash.merge');
var path = require('path');
var tap = require('tap');

var languages = require('../../languages.json');
var localeCompare = require('../../bin/lib/locale-compare');

tap.test('spotCheckWedo2Strings', function (t) {
    var isoCodes = Object.keys(languages);
    isoCodes.splice(isoCodes.indexOf('en'), 1);
    
    var ids = require(path.resolve(__dirname, '../../src/views/wedo2/l10n.json'));
    var viewLocales = {
        wedo2: {en: ids}
    };
    var idsWithICU = localeCompare.idToICUMap('wedo2', ids);
    var icuWithIds = localeCompare.icuToIdMap('wedo2', ids);
    var md5WithIds = localeCompare.getMD5Map(icuWithIds);
    var keysToCheck = Object.keys(merge(viewLocales.wedo2.en)).sort();
    for (var i in isoCodes) {
        var translations = localeCompare.getTranslationsForLanguage(isoCodes[i], idsWithICU, md5WithIds);
        t.same(
            Object.keys(translations.wedo2[isoCodes[i]]).sort(),
            keysToCheck,
            'check About keys for language ' + isoCodes[i]
        );
    }
    t.end();
});
