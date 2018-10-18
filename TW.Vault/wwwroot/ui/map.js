﻿function parseMapPage($doc) {
    $doc = $doc || $(document);

    if (window.ranVaultMap) {
        return;
    }

    window.ranVaultMap = true;
    var canUse = true;
    var isUnloading = false;

    //  Hook into 'TWMap.displayForVillage', which is invoked whenever the village info popup is made
    //  by TW

    var mapOverlayTags = null;
    var currentVillageId = null;
    let $popup = $doc.find('#map_popup');

    $doc.find('#continent_id').parent().append('<span> - Using Vault</span>');
    let $openVaultLink = $('<button style="margin-left:1em;vertical-align:middle">Open Vault</button>');
    $doc.find('#continent_id').parent().append($openVaultLink);

    $openVaultLink.click((e) => {
        e.originalEvent.preventDefault();
        displayMainVaultUI();
        return false;
    });
    
    var cachedData = {};
    let requestedVillageIds = [];
    let settings = loadSettings();
    let lockedDataReasons = null;

    //  Villages in any tribe: ___ANY___
    //  Villages not in a tribe: ___NONE___
    let selectedHighlightTribeName = "___ANY___";

    const TAG_TYPES = {
        NOBLES: 'nobles',
        NUKE: 'nuke',
        STACKED: 'stacked'
    };

    let tagIconTemplates = {};
    tagIconTemplates[TAG_TYPES.NOBLES] = `
        <span class="marker" style="background-color:rgb(254,254,0)">
            <img src="/graphic/unit_map/snob.png" style="width:18px;height:18px;">
        </span>
    `.trim();

    tagIconTemplates[TAG_TYPES.NUKE] = `
        <span class="marker" style="background-color:rgb(254,0,0)">
            <img src="/graphic/unit_map/axe.png" style="width:18px;height:18px;">
        </span>
    `.trim();

    tagIconTemplates[TAG_TYPES.STACKED] = `
        <span class="marker">
            <img src="/graphic/unit_map/spear.png" style="width:18px;height:18px;">
        </span>
    `.trim();
    

    $(window).unload(() => isUnloading = true);

    //  Get all data for the whole world for now
    lib.getApi(`village/0/0/1000/1000/tags`)
        .done((data) => {
            console.log('Got map tags: ', data);
            mapOverlayTags = data;

            let villages = lib.objectToArray(data, (_, v) => v);
            let tribeNames = villages.map((d) => d.tribeName).distinct();
            let $highlightTribeSelect = $('#vault-overlay-highlight-tribe');

            tribeNames.sort();

            $highlightTribeSelect.append('<option value="___ANY___" selected>Any</option>');
            $highlightTribeSelect.append('<option value="___NONE___">No</option>');

            tribeNames.forEach((n) => {
                if (!n) {
                    return;
                }

                $highlightTribeSelect.append(`<option value="${n}">${n}</option>`);
            });

            if (settings.showOverlay)
                applyMapOverlay();
        });

    createSettingsUI();

    //  First call that actually shows the popup - Update the popup if we've already downloaded village data
    let originalDisplayForVillage = TWMap.popup.displayForVillage;
    TWMap.popup.displayForVillage = function (e, a, t) {
        console.log('intercepted displayForVillage');
        originalDisplayForVillage.call(TWMap.popup, e, a, t);

        if (isUnloading) {
            return;
        }

        if (lockedDataReasons) {
            makeFuckYouContainer();
            return;
        }

        if (!canUse)
            return;

        let villageInfo = e;
        let villageId = villageInfo.id;

        currentVillageId = villageId;
        if (cachedData[villageId]) {
            makeOutput(cachedData[villageId]);
        } else if (TWMap.popup._cache[villageId]) {
            let twCached = TWMap.popup._cache[villageId];
            if (requestedVillageIds.indexOf(villageId) >= 0) {
                return;
            }
            let morale = Math.round((twCached.morale || twCached.mood) * 100);
            if (isNaN(morale) || morale > 100)
                morale = 100;
            loadVillageTroopData(villageId, morale);
        }
    };

    // Call made after popup is shown and TW has downloaded data for the village (ie incoming attacks, morale, etc)
    let originalReceivedInfo = TWMap.popup.receivedPopupInformationForSingleVillage;
    TWMap.popup.receivedPopupInformationForSingleVillage = function (e) {
        console.log('Intercepted receivedPopupInformation');
        originalReceivedInfo.call(TWMap.popup, e);

        if (isUnloading) {
            return;
        }

        if (lockedDataReasons) {
            makeFuckYouContainer();
            return;
        }

        let villageInfo = e;
        if (!villageInfo || !villageInfo.id)
            return;

        currentVillageId = villageInfo.id;
        let villageId = villageInfo.id;
        //  Why is "mood" a thing (alternate name for "morale")
        let morale = Math.round((villageInfo.morale || villageInfo.mood) * 100);
        if (isNaN(morale))
            morale = 100;

        if (cachedData[villageInfo.id]) {
            makeOutput(cachedData[villageId]);
        } else {
            if (requestedVillageIds.indexOf(villageId) >= 0) {
                return;
            }
            loadVillageTroopData(villageId, morale);
        }
    };

    let originalSpawnSector = TWMap.mapHandler.spawnSector;
    TWMap.mapHandler.spawnSector = function (data, sector) {
        originalSpawnSector.call(TWMap.mapHandler, data, sector);

        if (mapOverlayTags && settings.showOverlay)
            applyMapOverlay(sector._elements);
    };

    function loadVillageTroopData(villageId, morale) {
        requestedVillageIds.push(villageId);
        lib.getApi(`village/${villageId}/army?morale=${morale}`)
            .done((data) => {
                console.log('Got village data: ', data);

                data.morale = morale;
                cachedData[villageId] = data;

                //  User changed village while the data was loading
                if (villageId != currentVillageId) {
                    return;
                }

                makeOutput(data);
            })
            .error((xhr) => {
                if (!canUse)
                    return;

                if (xhr.status == 423) {
                    let reasons = null;
                    try {
                        reasons = JSON.parse(xhr.responseText);
                        lockedDataReasons = reasons;
                    } catch (_) { }

                    let alertMessage = "You haven't uploaded data in a while, you can't use the map script until you do. Click the 'Show' link at the top of the page to start uploading. (Then refresh the page)"
                    if (reasons) {
                        alertMessage += `\nYou need to upload: ${reasons.join(', ')}`;
                    }

                    alert(alertMessage);
                    canUse = false;
                } else if (xhr.status != 401) {
                    if (!isUnloading) {
                        alert("An error occurred...");
                    }
                }
            });
    }

    function applyMapOverlay(elements) {
        if (!elements) {
            elements = lib.objectToArray(TWMap.map._visibleSectors, (_, v) => v).map((s) => s._elements).flat();
        }

        elements.forEach((img) => {
            const imgId = img.id;
            if (imgId == null) {
                return;
            }
            let villageId = imgId.match(/map_village_(\d+)/);
            if (!villageId) {
                return;
            }
            villageId = parseInt(villageId[1]);

            if (!mapOverlayTags[villageId]) {
                return;
            }

            let $parent = $(img).parent();
            let x = $(img).css('left');
            let y = $(img).css('top');

            if (hasHighlights(mapOverlayTags[villageId])) {
                let $overlay = $(`<div id="vault_overlay_${villageId}">`);
                $overlay.css({
                    width: '52px',
                    height: '37px',
                    position: 'absolute',
                    left: x,
                    top: y,
                    'z-index': 50,
                    outline: 'rgba(51, 255, 0, 0.7) solid 2px',
                    'background-color': 'rgba(155, 252, 10, 0.14)'
                });

                $overlay.appendTo($parent);
            }

            let tags = makeTagElements(mapOverlayTags[villageId]);

            tags.forEach((tag, i) => {
                let $tag = $(tag);
                $tag.css({
                    position: 'absolute',
                    left: x,
                    top: y,
                    'z-index': 51,
                    'margin-top': '18px',
                    'margin-left': `${20 * i}px`
                })

                $tag.appendTo($parent);
            });
        });
    }

    function selectedTribeTag(tag) {
        if (selectedHighlightTribeName != "___ANY___") {
            if (selectedHighlightTribeName == "___NONE___" && tag.tribeName) {
                return false;
            } else if (selectedHighlightTribeName != tag.tribeName) {
                return false;
            }
        }

        return true;
    }

    function hasHighlights(tag) {
        if (!selectedTribeTag(tag)) {
            return false;
        }

        switch (settings.overlayHighlights) {
            case 'none': return false;
            case 'all': return true;

            case 'limited':
                return (settings.overlayShowStacks && isRecentIntel(tag.stackSeenAt)) ||
                       (settings.overlayShowNukes  && isRecentIntel(tag.nukeSeenAt)) ||
                       (settings.overlayShowNobles && isRecentIntel(tag.noblesSeenAt));
        }
    }

    function makeTagElements(tag, villageId) {
        let result = [];

        if (!selectedTribeTag(tag)) {
            return result;
        }

        if (tag.isStacked && isRecentIntel(tag.stackSeenAt) && settings.overlayShowStacks) {
            let $stackedIcon = $(tagIconTemplates[TAG_TYPES.STACKED]);
            $stackedIcon.prop('id', `vault_overlay_icon_${TAG_TYPES.STACKED}_${villageId}`)
            let stackSize = tag.stackDVs;
            let colorScale = [
                settings.stackMinDV,
                settings.stackMaxDV
            ];

            let colors = [
                [120, 255, 60],
                [255, 255, 0],
                [255, 0, 0],
            ];

            let scale = (stackSize - colorScale[0]) / (colorScale[1] - colorScale[0]);
            if (scale < 0) scale = 0;
            if (scale > 1) scale = 1;
            
            color = blend(scale, colors);

            $stackedIcon.css({
                'background-color': `rgb(${color[0]}, ${color[1]}, ${color[2]})`
            });

            result.push($stackedIcon);
        }
        if (tag.hasNuke && isRecentIntel(tag.nukeSeenAt) && settings.overlayShowNukes) {
            let $nukeIcon = $(tagIconTemplates[TAG_TYPES.NUKE]);
            $nukeIcon.prop('id', `vault_overlay_icon_${TAG_TYPES.NUKE}_${villageId}`);
            result.push($nukeIcon);
        }
        if (tag.hasNobles && isRecentIntel(tag.noblesSeenAt) && settings.overlayShowNobles) {
            let $nobleIcon = $(tagIconTemplates[TAG_TYPES.NOBLES]);
            $nobleIcon.prop('id', `vault_overlay_icon_${TAG_TYPES.NOBLES}_${villageId}`);
            result.push($nobleIcon);
        }

        return result;
    }

    function isRecentIntel(intelDate) {
        return intelDate && intelDate.valueOf() > lib.getServerDateTime().valueOf() - 24 * 60 * 60 * 1000 * settings.maxIntelAgeDays;
    }

    function makeOutputContainer() {
        let $villageInfoContainer = $('<div id="vault_info" style="background-color:#e5d7b2;">');
        $villageInfoContainer.appendTo($popup);
        return $villageInfoContainer;
    }

    function makeOutput(data) {
        if ($('#vault_info').length) {
            return;
        }

        if (isUnloading) {
            return;
        }

        let $villageInfoContainer = makeOutputContainer();

        //  Limit "own commands" to max 2
        let $commandRows = $('.command-row');
        let twCommandData = [];

        //  Remove all except non-small attacks
        for (var i = 0; i < $commandRows.length; i++) {
            let $row = $($commandRows[i]);
            let $images = $row.find('img');
            let isSmall = false;
            let isSupport = true;
            let isOwn = false;
            let isReturning = false;
            $images.each((i, el) => {
                let $el = $(el);
                if ($el.prop('src').contains('attack_'))
                    isOwn = true;

                if ($el.prop('src').contains("attack_small"))
                    isSmall = true;

                if ($el.prop('src').contains('attack'))
                    isSupport = false;

                if ($el.prop('src').contains('return'))
                    isReturning = true;
            });

            //  Collect command data for later
            let commandData = {
                isSmall: isSmall,
                isSupport: isSupport,
                isOwn: isOwn,
                isReturning: isReturning
            };

            twCommandData.push(commandData);

            if ((isSmall || isSupport) && $commandRows.length > 2) {
                $($commandRows[i]).remove();
                $commandRows = $('.command-row');
                --i;
            }
        }

        //  Remove intel rows
        $('#info_last_attack').closest('tr').remove();
        $('#info_last_attack_intel').closest('tr').remove();

        $('#info_content').css('width', '100%');

        //  Update data with what's been loaded by TW (in case someone forgot to upload commands)
        let hasRecord = (id) => (data.fakes && data.fakes.contains(id)) || (data.dVs && data.dVs[id]) || (data.nukes && data.nukes.contains(id));

        let numFakes = data.fakes ? data.fakes.length : 0;
        let numNukes = data.nukes ? data.nukes.length : 0;
        let numPlayers = data.players ? data.players.length : 0;

        let numDVs = 0;
        lib.objForEach(data.Dvs, (commandId, pop) => {
            numDVs += pop / 20000;
        });
        numDVs = Math.roundTo(numDVs, 1);

        twCommandData.forEach((cmd) => {
            if (!cmd.isOwn || hasRecord(cmd.commandId) || cmd.isReturning)
                return;

            if (!cmd.isSupport) {
                if (cmd.isSmall)
                    numFakes++;
                else
                    numNukes++;
            }
        });

        //  NOTE - This assumes no archers!
        $villageInfoContainer.html(`
                    ${ !settings.showCommands ? '' : `
                        <table class='vis' style="width:100%">
                            <tr>
                                <th># Fakes</th>
                                <th># Nukes</th>
                                <th># DVs</th>
                                <th># Players Sending</th>
                            </tr>
                            <tr>
                                <td>${numFakes}</td>
                                <td>${numNukes}</td>
                                <td>${numDVs}</td>
                                <td>${numPlayers}</td>
                            </tr>
                        </table>
                    `}
                    ${ !data.stationedArmy && !data.travelingArmy && !data.recentlyLostArmy && !data.ownedArmy ? '<div style="text-align:center;padding:0.5em;">No army data available.</div>' : `
                    <table class='vis' style="width:100%">
                        <tr style="background-color:#c1a264 !important">
                            <th>Vault</th>
                            <th>Seen at</th>
                            <th><img src="https://dsen.innogamescdn.com/8.136/37951/graphic/unit/unit_spear.png" title="" alt="" class=""></th>
                            <th><img src="https://dsen.innogamescdn.com/8.136/37951/graphic/unit/unit_sword.png" title="" alt="" class=""></th>
                            <th><img src="https://dsen.innogamescdn.com/8.136/37951/graphic/unit/unit_axe.png" title="" alt="" class=""></th>
                            <th><img src="https://dsen.innogamescdn.com/8.136/37951/graphic/unit/unit_spy.png" title="" alt="" class=""></th>
                            <th><img src="https://dsen.innogamescdn.com/8.136/37951/graphic/unit/unit_light.png" title="" alt="" class=""></th>
                            <th><img src="https://dsen.innogamescdn.com/8.136/37951/graphic/unit/unit_heavy.png" title="" alt="" class=""></th>
                            <th><img src="https://dsen.innogamescdn.com/8.136/37951/graphic/unit/unit_ram.png" title="" alt="" class=""></th>
                            <th><img src="https://dsen.innogamescdn.com/8.136/37951/graphic/unit/unit_catapult.png" title="" alt="" class=""></th>
                            <th><img src="https://dsen.innogamescdn.com/8.136/37951/graphic/unit/unit_knight.png" title="" alt="" class=""></th>
                            <th><img src="https://dsen.innogamescdn.com/8.136/37951/graphic/unit/unit_snob.png" title="" alt="" class=""></th>
                        </tr>
                        ${ !data.atHomeArmy ? '' : `
                        <tr>
                            <td>At home</td>
                            <td>${data.atHomeSeenAt ? lib.formatDateTime(data.atHomeSeenAt) : ''}</td>
                            ${makeTroopTds(data.atHomeArmy || {})}
                        </tr>
                        `}
                        ${ !data.stationedArmy ? '' : `
                        <tr>
                            <td>Stationed</td>
                            <td>${data.stationedSeenAt ? lib.formatDateTime(data.stationedSeenAt) : ''}</td>
                            ${makeTroopTds(data.stationedArmy || {})}
                        </tr>
                        `}
                        ${ !data.travelingArmy ? '' : `
                        <tr>
                            <td>Traveling</td>
                            <td>${data.travelingSeenAt ? lib.formatDateTime(data.travelingSeenAt) : ''}</td>
                            ${makeTroopTds(data.travelingArmy || {})}
                        </tr>
                        `}
                        ${ !data.recentlyLostArmy ? '' : `
                        <tr>
                            <td>Recently lost</td>
                            <td>${data.recentlyLostArmySeenAt ? lib.formatDateTime(data.recentlyLostArmySeenAt) : ''}</td>
                            ${makeTroopTds(data.recentlyLostArmy || {})}
                        </tr>
                        `}
                        ${ !data.ownedArmy ? '' : `
                        <tr>
                            <td>Owned</td>
                            <td>${data.ownedArmySeenAt ? lib.formatDateTime(data.ownedArmySeenAt) : ''}</td>
                            ${makeTroopTds(data.ownedArmy || {})}
                        </tr>
                        `}
                        ${ !settings.showPossiblyRecruited ? '' : `
                            ${ !data.possibleRecruitedOffensiveArmy || !data.possibleRecruitedDefensiveArmy ? '' : `
                            <tr>
                                <td rowspan="2">Possibly recruited</td>
                                <td></td>
                                ${makeTroopTds(data.possibleRecruitedOffensiveArmy || {})}
                            </tr>
                            <tr>
                                <td></td>
                                ${makeTroopTds(data.possibleRecruitedDefensiveArmy || {})}
                            </tr>
                            `}
                        `}
                        ${ !data.nukesRequired || !settings.showNukes ? '' : `
                        <tr>
                            <td colspan=12 style="text-align:center">Will take ~${data.nukesRequired} nukes to clear at ${data.morale}% morale (last nuke has ~${data.lastNukeLossPercent}% losses)</td>
                        </tr>
                        `}
                    </table>
                    `}
                    ${ !settings.showBuildings ? '' : `
                        ${ typeof data.lastBuildings == 'undefined' || data.lastBuildings == null ? '<div style="text-align:center;padding:0.5em;">No building data available.</div>' : `
                        <table class='vis' style="width:100%">
                            <tr style="background-color:#c1a264 !important">
                                <th>Vault</th>
                                <th>Seen at</th>
                                <th><img src="https://dsen.innogamescdn.com/8.137/38092/graphic/buildings/snob.png" title="Academy" alt="" class="bmain_list_img"></th>
                                <th><img src="https://dsen.innogamescdn.com/8.137/38092/graphic/buildings/smith.png" title="Smithy" alt="" class="bmain_list_img"></th>
                                <th><img src="https://dsen.innogamescdn.com/8.137/38092/graphic/buildings/farm.png" title="Farm" alt="" class="bmain_list_img"></th>
                                <th><img src="https://dsen.innogamescdn.com/8.137/38092/graphic/buildings/wall.png" title="Wall" alt="" class="bmain_list_img"></th>
                            </tr>
                            <tr>
                                <td>Latest levels</td>
                                <td>${data.lastBuildingsSeenAt ? lib.formatDateTime(data.lastBuildingsSeenAt) : ''}</td>
                                <td>${data.lastBuildings ? data.lastBuildings['snob'] || '-' : '' }</td>
                                <td>${data.lastBuildings ? data.lastBuildings['smith'] || '-' : '' }</td>
                                <td>${data.lastBuildings ? data.lastBuildings['farm'] || '-' : '' }</td>
                                <td>${data.lastBuildings ? data.lastBuildings['wall'] || '-' : '' }</td>
                            </tr>
                            <tr>
                                <td>Possible levels</td>
                                <td></td>
                                <td>${data.possibleBuildings ? data.possibleBuildings['snob'] || '-' : ''}</td>
                                <td>${data.possibleBuildings ? data.possibleBuildings['smith'] || '-' : ''}</td>
                                <td>${data.possibleBuildings ? data.possibleBuildings['farm'] || '-' : ''}</td>
                                <td>${data.possibleBuildings ? data.possibleBuildings['wall'] || '-' : '' }</td>
                            </tr>
                        </table>
                        `}
                    `}
                    ${ typeof data.lastLoyalty == 'undefined' || data.lastLoyalty == null || !settings.showLoyalty ? '' : `
                    <table class='vis' style="width:100%">
                        <tr style="background-color:#c1a264 !important">
                            <th>Vault</th>
                            <th>Seen at</th>
                            <th>Loyalty</th>
                        </tr>
                        <tr>
                            <td>Latest loyalty</td>
                            <td>${data.lastLoyaltySeenAt ? lib.formatDateTime(data.lastLoyaltySeenAt) : ''}</td>
                            <td>${data.lastLoyalty ? data.lastLoyalty || '-' : ''}</td>
                        </tr>
                        <tr>
                            <td>Possible loyalty</td>
                            <td></td>
                            <td>${data.possibleLoyalty ? data.possibleLoyalty || '-' : ''}</td>
                        </tr>
                    </table>
                    `}
                `.trim());
    }

    function makeFuckYouContainer() {
        if ($('#vault_info').length)
            return;

        $('#info_content').css('width', '100%');

        let $villageInfoContainer = makeOutputContainer();

        let fuckYouMessage = '';
        for (var i = 0; i < lockedDataReasons.length; i++) {
            if (fuckYouMessage.length && i != lockedDataReasons.length - 1) {
                fuckYouMessage += ', ';
            }
            if (i > 0 && i == lockedDataReasons.length - 1) {
                fuckYouMessage += ' and ';
            }
            fuckYouMessage += lockedDataReasons[i];
        }

        $villageInfoContainer.html(`
            <h3 style="padding:1em; text-align:center;margin:0">
                Upload your damn ${fuckYouMessage}!!
                <br>
                <br>
                (then refresh this page)
            </h3>
        `);
    }

    function makeTroopTds(troops) {
        var counts = [];
        counts.push(troops['spear']);
        counts.push(troops['sword']);
        counts.push(troops['axe']);
        counts.push(troops['spy']);
        counts.push(troops['light']);
        counts.push(troops['heavy']);
        counts.push(troops['ram']);
        counts.push(troops['catapult']);
        counts.push(troops['knight']);
        counts.push(troops['snob']);

        var parts = [];
        counts.forEach((cnt) => parts.push(`<td>${cnt || cnt == 0 ? cnt : ''}</td>`));
        return parts.join(' ');
    }

    function createSettingsUI() {

        let $container = $(`
            <div>
                <h4>Hover Settings</h4>
                <p>
                    <input type="checkbox" id="vault-show-commands" ${settings.showCommands ? 'checked' : ''}>
                    <label for="vault-show-commands">Commands</label>

                    <input type="checkbox" id="vault-show-recruits" ${settings.showPossiblyRecruited ? 'checked' : ''}>
                    <label for="vault-show-recruits">Possible recruits</label>

                    <input type="checkbox" id="vault-show-buildings" ${settings.showBuildings ? 'checked' : ''}>
                    <label for="vault-show-buildings">Buildings</label>

                    <input type="checkbox" id="vault-show-nukes" ${settings.showNukes ? 'checked' : ''}>
                    <label for="vault-show-nukes">Nukes required</label>

                    <input type="checkbox" id="vault-show-loyalty" ${settings.showLoyalty ? 'checked' : ''}>
                    <label for="vault-show-loyalty">Loyalty</label>
                </p>
                <h4>Overlay Settings</h4>
                <p>
                    <p>
                        <input type="checkbox" id="vault-show-overlay" ${settings.showOverlay ? 'checked' : ''}>
                        <label for="vault-show-overlay">Show overlay</label>

                        <label for="vault-overlay-max-age">Ignore intel over </label>
                        <input id="vault-overlay-max-age" style="text-align:center;width:1.75em" value="${settings.maxIntelAgeDays}">
                        <label for="vault-overlay-max-age"> days old</label>

                        <select id="vault-overlay-highlight-method" style="margin-left:1.5em">
                            <option value="none" ${settings.overlayHighlights == "none" ? "selected" : ''}>None</option>
                            <option value="limited" ${settings.overlayHighlights == "limited" ? "selected" : ''}>Has group</option>
                            <option value="all" ${settings.overlayHighlights == "all" ? "selected" : ''}>Has intel</option>
                        </select>
                        <label for="vault-overlay-highlight-method">Highlights</label>

                        <input type="checkbox" id="vault-overlay-show-nukes" ${settings.overlayShowNukes ? 'checked' : ''}>
                        <label for="vault-overlay-show-nukes">Nukes</label>

                        <input type="checkbox" id="vault-overlay-show-nobles" ${settings.overlayShowNobles ? 'checked' : ''}>
                        <label for="vault-overlay-show-nobles">Nobles</label>

                        <input type="checkbox" id="vault-overlay-show-stacks" ${settings.overlayShowStacks ? 'checked' : ''}>
                        <label for="vault-overlay-show-stacks">Stacks</label>
                    </p>

                    <p>
                        <label for="vault-overlay-stack-min-dv">A small stack is </label>
                        <input type="text" id="vault-overlay-stack-min-dv" style="width:1.5em;text-align:center" value="${settings.stackMinDV}">
                        <label for="vault-overlay-stack-min-dv">DV</label>, and

                        <label for="vault-overlay-stack-max-dv">a big stack is </label>
                        <input type="text" id="vault-overlay-stack-max-dv" style="width:1.5em;text-align:center" value="${settings.stackMaxDV}">
                        <label for="vault-overlay-stack-max-dv">DV</label>
                    </p>

                    <p>
                        Highlight villages in
                        <select id="vault-overlay-highlight-tribe"></select>
                        tribe
                    </p>
                </p>
            </div>
        `.trim());

        $container.find('label:not([for^=vault-overlay-stack-]):not([for=vault-overlay-max-age])').css({
            'margin-right': '1.5em'
        });

        $('#content_value > h2').after($container);

        $container.find('#vault-show-commands').change(() => {
            let $checkbox = $container.find('#vault-show-commands');
            console.log('settings.showCommands = ' + $checkbox.prop('checked'));
            settings.showCommands = $checkbox.prop('checked');
            saveSettings(settings);
        });

        $container.find('#vault-show-recruits').change(() => {
            let $checkbox = $container.find('#vault-show-recruits');
            console.log('settings.showRecruits = ' + $checkbox.prop('checked'));
            settings.showPossiblyRecruited = $checkbox.prop('checked');
            saveSettings(settings);
        });

        $container.find('#vault-show-buildings').change(() => {
            let $checkbox = $container.find('#vault-show-buildings');
            console.log('settings.showBuildings = ' + $checkbox.prop('checked'));
            settings.showBuildings = $checkbox.prop('checked');
            saveSettings(settings);
        });

        $container.find('#vault-show-nukes').change(() => {
            let $checkbox = $container.find('#vault-show-nukes');
            console.log('settings.showNukes = ' + $checkbox.prop('checked'));
            settings.showNukes = $checkbox.prop('checked');
            saveSettings(settings);
        });

        $container.find('#vault-show-loyalty').change(() => {
            let $checkbox = $container.find('#vault-show-loyalty');
            console.log('settings.showLoyalty = ' + $checkbox.prop('checked'));
            settings.showLoyalty = $checkbox.prop('checked');
            saveSettings(settings);
        });

        $container.find('#vault-show-overlay').change(() => {
            settings.showOverlay = $container.find('#vault-show-overlay').prop('checked');
            saveSettings(settings);

            if (settings.showOverlay && mapOverlayTags) {
                applyMapOverlay();
            } else {
                $('*[id^=vault_overlay]').remove();
            }
        });

        $container.find('#vault-overlay-max-age').change(() => {
            let max = parseInt($container.find('#vault-overlay-max-age').val());
            if (isNaN(max) || max <= 0) {
                return;
            }
            settings.maxIntelAgeDays = max;
            saveSettings(settings);

            $('*[id^=vault_overlay]').remove();
            if (settings.showOverlay && mapOverlayTags)
                applyMapOverlay();
        });

        $container.find('#vault-overlay-highlight-method').change(() => {
            settings.overlayHighlights = $('#vault-overlay-highlight-method').val();
            saveSettings(settings);

            $('*[id^=vault_overlay]').remove();
            if (settings.showOverlay && mapOverlayTags)
                applyMapOverlay();
        });

        $container.find('#vault-overlay-show-nukes').change(() => {
            let showNukes = $container.find('#vault-overlay-show-nukes').prop('checked');
            settings.overlayShowNukes = showNukes;
            saveSettings(settings);

            $('*[id^=vault_overlay]').remove();
            if (settings.showOverlay && mapOverlayTags)
                applyMapOverlay();
        });

        $container.find('#vault-overlay-show-nobles').change(() => {
            let showNobles = $container.find('#vault-overlay-show-nobles').prop('checked');
            settings.overlayShowNobles = showNobles;
            saveSettings(settings);

            $('*[id^=vault_overlay]').remove();
            if (settings.showOverlay && mapOverlayTags)
                applyMapOverlay();
        });

        $container.find('#vault-overlay-show-stacks').change(() => {
            let showStacks = $container.find('#vault-overlay-show-stacks').prop('checked');
            settings.overlayShowStacks = showStacks;
            saveSettings(settings);

            $('*[id^=vault_overlay]').remove();
            if (settings.showOverlay && mapOverlayTags)
                applyMapOverlay();
        });

        $container.find('#vault-overlay-stack-min-dv').change(() => {
            let min = parseInt($container.find('#vault-overlay-stack-min-dv').val());
            if (isNaN(min) || min <= 0) {
                return;
            }
            settings.stackMinDV = min;
            saveSettings(settings);

            $('*[id^=vault_overlay]').remove();
            if (settings.showOverlay && mapOverlayTags)
                applyMapOverlay();
        });

        $container.find('#vault-overlay-stack-max-dv').change(() => {
            let max = parseInt($container.find('#vault-overlay-stack-max-dv').val());
            if (isNaN(max) || max <= 0) {
                return;
            }
            settings.stackMaxDV = max;
            saveSettings(settings);

            $('*[id^=vault_overlay]').remove();
            if (settings.showOverlay && mapOverlayTags)
                applyMapOverlay();
        });

        $container.find('#vault-overlay-highlight-tribe').change(() => {
            let selected = $container.find('#vault-overlay-highlight-tribe').val();
            if (!selected) {
                return;
            }

            selectedHighlightTribeName = selected;

            $('*[id^=vault_overlay]').remove();
            if (settings.showOverlay && mapOverlayTags)
                applyMapOverlay();
        });
    }

    function loadSettings() {
        var settings = $.extend({
            showCommands: true,
            showPossiblyRecruited: true,
            showBuildings: true,
            showNukes: true,
            showLoyalty: true,
            showOverlay: true,
            maxIntelAgeDays: 5,
            overlayHighlights: "limited",
            overlayShowNukes: true,
            overlayShowNobles: true,
            overlayShowStacks: true,
            stackMinDV: 1,
            stackMaxDV: 8
        }, lib.getLocalStorage('map-settings') || {});

        saveSettings(settings);

        return settings;
    }

    function saveSettings(settings) {
        lib.setLocalStorage('map-settings', settings);
    }



    //  Blends between the given set of colors using 'norm' as a percentage;
    //  colors[0] = 0% and colors[size] = 100%
    //  
    //  Blends using LAB color space rather than RGB or HSV, so that changes
    //  in the color based on blending are perceived proportionally to the
    //  percentage
    function blend(norm, colors) {
        //  HSV blending
        //let fromrgb = (c) => rgbToHsv(c[0], c[1], c[2]);
        //let torgb = (c) => hsvToRgb(c[0], c[1], c[2]);

        //  LAB blending
        let fromrgb = rgb2lab;
        let torgb = lab2rgb;

        //  RGB blending
        //let fromrgb = (c) => c;
        //let torgb = (c) => c;

        let sumDiff = 0;
        let labs = [];
        let tfcs = []; // transformed colors
        var i;

        for (i = 0; i < colors.length; i++) {
            labs.push(rgb2lab(colors[i]));
            tfcs.push(fromrgb(colors[i]));
        }

        for (i = 0; i < colors.length - 1; i++) {
            sumDiff += labdE(labs[i], labs[i + 1]);
        }

        let bandSizes = [];
        for (i = 0; i < colors.length - 1; i++) {
            bandSizes.push(labdE(labs[i], labs[i + 1]) / sumDiff);
        }

        let start = 0, band = 0;
        for (i = 0; i < bandSizes.length; i++) {
            let bs = bandSizes[i];
            if (norm >= start && norm <= start + bs) {
                norm = (norm - start) / bs;
                band = i;
                break;
            } else {
                start += bs;
            }
        }

        let blended = [
            tfcs[band + 1][0] * norm + tfcs[band][0] * (1 - norm),
            tfcs[band + 1][1] * norm + tfcs[band][1] * (1 - norm),
            tfcs[band + 1][2] * norm + tfcs[band][2] * (1 - norm),
        ];
        
        let rgb = torgb(blended);
        return rgb;
    }



    //  https://raw.githubusercontent.com/antimatter15/rgb-lab/master/color.js

    function lab2rgb(lab) {
        var y = (lab[0] + 16) / 116,
            x = lab[1] / 500 + y,
            z = y - lab[2] / 200,
            r, g, b;

        x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16 / 116) / 7.787);
        y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16 / 116) / 7.787);
        z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16 / 116) / 7.787);

        r = x * 3.2406 + y * -1.5372 + z * -0.4986;
        g = x * -0.9689 + y * 1.8758 + z * 0.0415;
        b = x * 0.0557 + y * -0.2040 + z * 1.0570;

        r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1 / 2.4) - 0.055) : 12.92 * r;
        g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1 / 2.4) - 0.055) : 12.92 * g;
        b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1 / 2.4) - 0.055) : 12.92 * b;

        return [Math.max(0, Math.min(1, r)) * 255,
        Math.max(0, Math.min(1, g)) * 255,
        Math.max(0, Math.min(1, b)) * 255]
    }


    function rgb2lab(rgb) {
        var r = rgb[0] / 255,
            g = rgb[1] / 255,
            b = rgb[2] / 255,
            x, y, z;

        r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
        z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

        x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
        y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
        z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

        return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
    }

    // calculate the perceptual distance between colors in CIELAB
    // https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs
    function labdE(labA, labB) {
        var deltaL = labA[0] - labB[0];
        var deltaA = labA[1] - labB[1];
        var deltaB = labA[2] - labB[2];
        var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
        var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
        var deltaC = c1 - c2;
        var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
        deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
        var sc = 1.0 + 0.045 * c1;
        var sh = 1.0 + 0.015 * c1;
        var deltaLKlsl = deltaL / (1.0);
        var deltaCkcsc = deltaC / (sc);
        var deltaHkhsh = deltaH / (sh);
        var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
        return i < 0 ? 0 : Math.sqrt(i);
    }

    /*** https://gist.github.com/mjackson/5311256 ***/

    /**
     * Converts an RGB color value to HSV. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
     * Assumes r, g, and b are contained in the set [0, 255] and
     * returns h, s, and v in the set [0, 1].
     *
     * @param   Number  r       The red color value
     * @param   Number  g       The green color value
     * @param   Number  b       The blue color value
     * @return  Array           The HSV representation
     */
    function rgbToHsv(r, g, b) {
        r /= 255, g /= 255, b /= 255;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max == 0 ? 0 : d / max;

        if (max == min) {
            h = 0; // achromatic
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return [h, s, v];
    }

    /**
     * Converts an HSV color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
     * Assumes h, s, and v are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   Number  h       The hue
     * @param   Number  s       The saturation
     * @param   Number  v       The value
     * @return  Array           The RGB representation
     */
    function hsvToRgb(h, s, v) {
        var r, g, b;

        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }

        return [r * 255, g * 255, b * 255];
    }
}