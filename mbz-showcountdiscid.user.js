/* global $ requests helper */
'use strict';
// ==UserScript==
// @name         MusicBrainz: Show discid count
// @namespace    mbz-loujine
// @author       loujine
// @version      2016.5.15
// @downloadURL  https://bitbucket.org/loujine/musicbrainz-scripts/raw/default/mbz-showcountdiscid.user.js
// @updateURL    https://bitbucket.org/loujine/musicbrainz-scripts/raw/default/mbz-showcountdiscid.user.js
// @supportURL   https://bitbucket.org/loujine/musicbrainz-scripts
// @icon         https://bitbucket.org/loujine/musicbrainz-scripts/raw/default/icon.png
// @description  musicbrainz.org: Show discid number on main release pages
// @compatible   firefox+greasemonkey
// @licence      CC BY-NC-SA 3.0 (https://creativecommons.org/licenses/by-nc-sa/3.0/)
// @require      https://greasyfork.org/scripts/13747-mbz-loujine-common/code/mbz-loujine-common.js?version=125991
// @include      http*://*musicbrainz.org/release/*
// @exclude      http*://*musicbrainz.org/release/add*
// @exclude      http*://*musicbrainz.org/release/*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

// adapted from jesus2099  mb. INLINE STUFF

// imported from mbz-loujine-common.js: requests, helper

function parseCount(resp, tab) {
    var cnt = 0;
    resp.media.forEach(function (medium) {
        cnt += medium.discs.length;
    });
    if (cnt > 0) {
        tab.style.setProperty('background-color', '#6f9');
    }
    tab.textContent += ' (' + cnt + ')';
}

(function showCountDiscid() {
    var tab = $("a[href$='/discids']")[0],
        url = helper.wsUrl('release', ['discids']);
    requests.GET(url, function (resp) {
        parseCount(JSON.parse(resp), tab);
    });
})();
