/* global $ requests helper sidebar */
'use strict';
// ==UserScript==
// @name         MusicBrainz: Display AcousticBrainz datasets count for work
// @namespace    mbz-loujine
// @author       loujine
// @version      2019.9.22
// @downloadURL  https://raw.githubusercontent.com/loujine/musicbrainz-scripts/master/mb-display_acousticbrainz_dataset_for_work.user.js
// @updateURL    https://raw.githubusercontent.com/loujine/musicbrainz-scripts/master/mb-display_acousticbrainz_dataset_for_work.user.js
// @supportURL   https://github.com/loujine/musicbrainz-scripts
// @icon         https://raw.githubusercontent.com/loujine/musicbrainz-scripts/master/icon.png
// @description  musicbrainz.org: display acousticbrainz count on Work page
// @compatible   firefox+tampermonkey
// @license      MIT
// @require      https://greasyfork.org/scripts/13747-mbz-loujine-common/code/mbz-loujine-common.js?version=241520
// @include      http*://*musicbrainz.org/work/*
// @exclude      http*://*musicbrainz.org/work/*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

const abzIconURL = "//acousticbrainz.org/static/images/favicon-16.png";

function showABids() {
    var $recordings = $('table a[href*="/recording/"]');
    var recording_mbids = $recordings.map(function() {
        return this.href.split('/')[4];
    }).get();
    if (recording_mbids.length > 125) {
        console.info('Warning: sending only the first 125 recordings '
                     + 'to AcousticBrainz');
        recording_mbids.splice(125);
    }
    var url = ('//acousticbrainz.org/api/v1/count?recording_ids='
               + recording_mbids.join(';'));
    $('thead > tr').append('<th>ABrainz</th>');
    $('.subh > th')[1].colSpan += 1;
    $('table.tbl > tbody > tr:not(".subh")').append('<td>');

    requests.GET(url, function (data) {
        data = JSON.parse(data);
        $recordings.each(function (idx, recording) {
            var mbid = helper.mbidFromURL(recording.href);
            if (data[mbid] === undefined || data[mbid].count === 0) {
                return;
            }
            $(recording).parents('tr').find('td:last').append(
                $('<a>', {
                    'href': '//acousticbrainz.org/' + mbid,
                    'target': '_blank',
                    'text': data[mbid].count
                }).append($('<img src="' + abzIconURL + '" class="abz" />'))
            );
        });
    });
}


(function displaySidebar() {
    sidebar.container().insertAdjacentHTML('beforeend', `
        <h3>Show AcousticBrainz IDs</h3>
        <input type="button" id="showABids" value="Show AcousticBrainz IDs">
    `);
})();

$(document).ready(function() {
    document.getElementById('showABids').addEventListener('click', showABids);
    return false;
});
