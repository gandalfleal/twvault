﻿
function parseOwnTroopsOverviewPage($doc) {
    $doc = $doc || $(document);

    let troopData = [];

    let $villageRows = $doc.find('#units_table tbody');
    $villageRows.each((i, el) => {
        let $el = $(el);
        let $troopRows = $el.find('tr');

        var villageId = $($troopRows[0]).find('td:first-of-type a').prop('href').match(/village=(\w+)/)[1];
        villageId = parseInt(villageId);

        let $atHomeTroops = $($troopRows[0]).find('.unit-item');
        let $stationedTroops = $($troopRows[1]).find('.unit-item');
        let $supportingTroops = $($troopRows[2]).find('.unit-item');
        let $travelingTroops = $($troopRows[3]).find('.unit-item');

        var atHomeTroops = {};
        var stationedTroops = {};
        var supportingTroops = {};
        var travelingTroops = {};

        $atHomeTroops.each((i, el) => atHomeTroops[indexToName(i)] = parseInt($(el).text()));
        $stationedTroops.each((i, el) => stationedTroops[indexToName(i)] = parseInt($(el).text()));
        $supportingTroops.each((i, el) => supportingTroops[indexToName(i)] = parseInt($(el).text()));
        $travelingTroops.each((i, el) => travelingTroops[indexToName(i)] = parseInt($(el).text()));

        var villageTroopData = {
            villageId: villageId,
            stationed: stationedTroops,
            traveling: travelingTroops,
            supporting: supportingTroops,
            atHome: atHomeTroops
        };

        console.log('Made village troop data: ', villageTroopData);

        troopData.push(villageTroopData);
    });

    return troopData;

    function indexToName(idx) {
        switch (idx) {
            case 0: return 'spear'; break;
            case 1: return 'sword'; break;
            case 2: return 'axe'; break;
            case 3: return 'spy'; break;
            case 4: return 'light'; break;
            case 5: return 'heavy'; break;
            case 6: return 'ram'; break;
            case 7: return 'catapult'; break;
            case 8: return 'paladin'; break;
            case 9: return 'snob'; break;
            case 10: return 'militia'; break;
        }
    }
}