'use strict';
var meta = function() {
// ==UserScript==
// @name         MusicBrainz: Create artist from wikidata
// @namespace    mbz-loujine
// @author       loujine
// @version      2016.4.13
// @downloadURL  https://bitbucket.org/loujine/musicbrainz-scripts/raw/default/mbz-create_artist_from_wikidata.user.js
// @updateURL    https://bitbucket.org/loujine/musicbrainz-scripts/raw/default/mbz-create_artist_from_wikidata.user.js
// @supportURL   https://bitbucket.org/loujine/musicbrainz-scripts
// @icon         https://bitbucket.org/loujine/musicbrainz-scripts/raw/default/icon.png
// @description  musicbrainz.org: Fill new artist info from wikidata
// @compatible   firefox+greasemonkey
// @licence      CC BY-NC-SA 3.0 (https://creativecommons.org/licenses/by-nc-sa/3.0/)
// @require      https://greasyfork.org/scripts/13747-mbz-loujine-common/code/mbz-loujine-common.js?version=106301
// @include      http*://*musicbrainz.org/artist/create*
// @include      http*://*mbsandbox.org/artist/create*
// @grant        none
// @run-at       document-end
// ==/UserScript==
};
if (meta && meta.toString && (meta = meta.toString())) {
    var meta = {'name': meta.match(/@name\s+(.+)/)[1],
                'version': meta.match(/@version\s+(.+)/)[1]};
}

// imported from mbz-loujine-common.js: wikidata, sidebar (for edit note)
var sidebar = sidebar,
    wikidata = wikidata;


function parseWikidata(entity) {
    var claims = entity.claims,
        lang = wikidata.language,
        url;
    if (!(lang in entity.labels)) {
        lang = Object.keys(entity.labels)[0];
    }
    // name and sort name
    document.getElementById('id-edit-artist.name').value = entity.labels[lang].value;
    document.getElementsByClassName('guesscase-title')[0].click();
    document.getElementsByClassName('guesscase-sortname')[0].click();

    // Disambiguation
    if (entity.descriptions[lang] && entity.descriptions[lang].value) {
        document.getElementById('id-edit-artist.comment').value = entity.descriptions[lang].value;
    }

    // Type and gender
    if (wikidata.fields.type in claims) {
        var type = claims[wikidata.fields.type][0].mainsnak.datavalue.value['numeric-id'];
        document.getElementById('id-edit-artist.type_id').value = type === wikidata.entities.person ? 1 :
                                                                  type === wikidata.entities.stringQuartet ? 2 :
                                                                  type === wikidata.entities.orchestra ? 2 :
                                                                  type === wikidata.entities.band ? 2 :
                                                                  type === wikidata.entities.rockBand ? 2 :
                                                                  0;
    }

    if (wikidata.fields.gender in claims) {
        var gender = claims[wikidata.fields.gender][0].mainsnak.datavalue.value['numeric-id'];
        document.getElementById('id-edit-artist.gender_id').value = gender === wikidata.entities.male ? 1 :
                                                                    gender === wikidata.entities.female ? 2 : 3;
    }

    // ISNI
    if (wikidata.fields.isni in claims) {
        var isni = claims[wikidata.fields.isni][0].mainsnak.datavalue.value;
        document.getElementsByName('edit-artist.isni_codes.0')[0].value = isni;
    }

    function _fillDate(strDate, nodeId) {
        var date = new Date(strDate.slice(1)); // remove leading "+"
        var yearInput = document.getElementById(nodeId + '.year');
        if (yearInput.getAttribute('class').contains('jesus2099')) {
            // jesus2099's EASY_DATE script is shifting the input node
            // containing the year but not its id
            yearInput.nextSibling.value = date.getFullYear();
        } else {
            yearInput.value = date.getFullYear();
        }
        document.getElementById(nodeId + '.month').value = date.getMonth() + 1;
        document.getElementById(nodeId + '.day').value = date.getDate();
    }

    // Dates & places
    if (wikidata.fields.birthDate in claims) {
        var birthDate = claims[wikidata.fields.birthDate][0].mainsnak.datavalue.value.time;
        _fillDate(birthDate, 'id-edit-artist.period.begin_date');
    }
    if (wikidata.fields.birthPlace in claims) {
        var birthPlace = 'Q' + claims[wikidata.fields.birthPlace][0].mainsnak.datavalue.value['numeric-id'];
        url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=' + birthPlace + '&format=json';
        $.ajax({
            url: url,
            dataType: 'jsonp',
        }).done(function (data) {
            var entityArea = data.entities[birthPlace],
                input = document.getElementById('id-edit-artist.begin_area.name');
            if (wikidata.fields.mbidArea in entityArea.claims) {
                var mbid = entityArea.claims[wikidata.fields.mbidArea][0].mainsnak.datavalue.value;
                input.value = mbid;
                $(input).trigger('keydown');
            } else {
                input.value = entityArea.labels[lang].value;
            }
        });
    }
    if (wikidata.fields.deathDate in claims) {
        var deathDate = claims[wikidata.fields.deathDate][0].mainsnak.datavalue.value.time;
        _fillDate(deathDate, 'id-edit-artist.period.end_date');
    }
    if (wikidata.fields.deathPlace in claims) {
        var deathPlace = 'Q' + claims[wikidata.fields.deathPlace][0].mainsnak.datavalue.value['numeric-id'];
        url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=' + deathPlace + '&format=json';
        $.ajax({
            url: url,
            dataType: 'jsonp',
        }).done(function (data) {
            var entityArea = data.entities[deathPlace],
                input = document.getElementById('id-edit-artist.end_area.name');
            if (wikidata.fields.mbidArea in entityArea.claims) {
                var mbid = entityArea.claims[wikidata.fields.mbidArea][0].mainsnak.datavalue.value;
                input.value = mbid;
                $(input).trigger('keydown');
            } else {
                input.value = entityArea.labels[lang].value;
            }
        });
    }

    ['idVIAF', 'idGND', 'idIMSLP'].forEach(function(externalLink) {
        if (wikidata.fields[externalLink] in claims) {
            var inputs = document.getElementById('external-links-editor')
                         .getElementsByTagName('input'),
                input = inputs[inputs.length - 1];
            input.value = wikidata.urls[externalLink]
                          + claims[wikidata.fields[externalLink]][0].mainsnak.datavalue.value;
            input.dispatchEvent(new Event('input', {'bubbles': true}));
        }
    });

}

function fillForm(wikidataURL) {
    function _getWikidataId(wikidataURL) {
        if (wikidataURL.split('/')[2] !== "www.wikidata.org") {
            throw "Not a wikidata link";
        }
        return wikidataURL.split('/')[4];
    }

    var wikiId = _getWikidataId(wikidataURL),
        url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=' +
              wikiId + '&format=json';
    $.ajax({
        url: url,
        dataType: 'jsonp',
    }).done(function (data) {
        var entity = data.entities[wikiId];
        if (wikidata.fields.mbidArtist in entity.claims) {
            var mbid = entity.claims[wikidata.fields.mbidArtist][0].mainsnak.datavalue.value;
            if (window.confirm('An artist already exists linked to this wikidata id, ' +
                               'click "ok" to redirect to their page')) {
                window.location.href='/artist/' + mbid;
            } else {
                parseWikidata(entity);
            }
        } else {
            parseWikidata(entity);
        }
    });
    document.getElementById('id-edit-artist.edit_note').value = sidebar.editNote(meta);
}

(function displayToolbar(relEditor) {
    $('div.half-width').prepend(
        relEditor.container()
        .append(
            $('<p>You can first add the wikidata link to retrieve automatically some information</p>')
        )
    );
})(relEditor);

document.addEventListener('DOMContentLoaded', function () {
    var node = document.getElementById('external-links-editor-container')
               .getElementsByTagName('input')[0];
    node.addEventListener('input', function () {
        var wikidataURL = node.value;
        fillForm(wikidataURL);
    }, false);
    return false;
});
