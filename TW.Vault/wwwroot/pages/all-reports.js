﻿function parseAllReports($doc, onProgress_, onDone_) {
    $doc = $doc || $(document);

    //# REQUIRE pages/reports-overview.js
    //# REQUIRE pages/view-report.js
    
    var requestManager = new RequestManager();

    let previousReports = lib.getLocalStorage('reports-history', []);

    let hasFilters = checkHasFilters();
    console.log('hasFilters = ', hasFilters);

    if (hasFilters) {
        if (onProgress_)
            onProgress_(lib.messages.FILTER_APPLIED('reports'));
        else
            alert(lib.messages.FILTER_APPLIED('reports'));

        if (onDone_) {
            onDone_(lib.errorCodes.FILTER_APPLIED);
        }
        return;
    }

    let reportLinks = [];

    // REPORTS_COLLECTING_PAGES
    onProgress_ && onProgress_('Collecting report pages...');
    let pages = lib.detectMultiPages($doc);
    pages.push(lib.makeTwUrl(lib.pageTypes.ALL_REPORTS));
    console.log('pages = ', pages);

    collectReportLinks();
    makeUploadsDisplay();


    function collectReportLinks() {
        // REPORTS_COLLECTING_LINKS
        let collectingReportLinksMessage = 'Collecting report links...';
        onProgress_ && onProgress_(collectingReportLinksMessage);

        pages.forEach((link) => {
            requestManager.addRequest(link, (data) => {
                // REPORTS_PAGES_PROGRESS
                onProgress_ && onProgress_(`${collectingReportLinksMessage} (page ${requestManager.getStats().done}/${pages.length})`);

                if (lib.checkContainsCaptcha(data)) {
                    if (requestManager.isRunning()) {
                        requestManager.stop();

                        if (onProgress_)
                            onProgress_(lib.messages.TRIGGERED_CAPTCHA);
                        else
                            alert(lib.messages.TRIGGERED_CAPTCHA);

                        onDone_ && onDone_(lib.errorCodes.CAPTCHA);
                    }

                    return;
                }

                let $pageDoc = $(data);
                let pageLinks = parseReportsOverviewPage($pageDoc);
                console.log('Got page links: ', pageLinks);
                reportLinks.push(...pageLinks);
            });
        });

        requestManager.setFinishedHandler(() => {
            requestManager.stop();
            console.log('Got all report links: ', reportLinks);

            collectFarmingReportLinks((farmReportIds) => {
                console.log('Got farm report IDs: ', farmReportIds);

                let filteredReports = reportLinks.except((l) => previousReports.contains(l.reportId));
                filteredReports = filteredReports.except((l) => farmReportIds.contains(l.reportId));

                // REPORTS_CHECK_UPLOADED
                onProgress_ && onProgress_('Checking for reports already uploaded...');
                getExistingReports(filteredReports.map(r => r.reportId), (existing) => {
                    console.log('Got existing reports: ', existing);

                    previousReports.push(...existing);
                    let withoutMissingReports = previousReports.except((r) => !reportLinks.contains((l) => l.reportId == r));
                    console.log('Updated reports cache without missing reports: ', withoutMissingReports);
                    lib.setLocalStorage('reports-history', withoutMissingReports);

                    let filteredLinks =
                        filteredReports.except((l) => previousReports.contains(l.reportId))
                            .map((l) => l.link)
                            .distinct();

                    console.log('Made filtered links: ', filteredLinks);

                    uploadReports(filteredLinks);
                });
            });
        });

        requestManager.start();
    }

    function collectFarmingReportLinks(onDone) {
        let $groupLinks = $doc.find('td > a[href*=group_id]:not([href*=view]):not(.village_switch_link)');
        // REPORTS_LOOT_ASSISTANT
        let $farmReportGroup = $groupLinks.filter((i, el) => $(el).text().contains('Loot Assistant'));

        if (!$farmReportGroup.length) {
            // REPORTS_LA_NOT_FOUND
            onProgress_ && onProgress_("Couldn't find Loot Assistant reports folder, skipping filtering...");
            setTimeout(() => onDone([]), 1500);
            return;
        }

        let farmGroupLink = $farmReportGroup.prop('href');
        let farmGroupId = farmGroupLink.match(/group_id=(\w+)/)[1];
        $.get(farmGroupLink)
            .done((data) => {
                // REPORTS_FILTERING_LA
                const baseFilteringMessage = "Filtering loot assistant reports...";
                onProgress_ && onProgress_(baseFilteringMessage);

                let $folderDoc = lib.parseHtml(data);
                let $lootFolderPages = [$folderDoc];
                // The .map isn't really necessary, but done so RequestManager doesn't complain of duplicate links
                let lootFolderPageLinks = lib.detectMultiPages($folderDoc).map(l => l + '&group_id=' + farmGroupId);

                requestManager.resetStats();

                lootFolderPageLinks.forEach((link) => {
                    requestManager.addRequest(link, (page) => {
                        $lootFolderPages.push(lib.parseHtml(page));
                        let stats = requestManager.getStats();
                        onProgress_ && onProgress_(`${baseFilteringMessage} (${stats.toString()})`);
                    });
                });

                requestManager.setFinishedHandler(() => {
                    requestManager.stop();
                    requestManager.resetStats();

                    let lootReportLinks = [];
                    $lootFolderPages.forEach(($page) => {
                        let pageLinks = parseReportsOverviewPage($page);
                        console.log('Got loot assistant report links: ', pageLinks);
                        lootReportLinks.push(...pageLinks);
                    });

                    onDone(lootReportLinks.map(l => l.reportId));
                });

                requestManager.start();
            })
            .error(() => {
                // REPORTS_LA_ERROR
                onProgress_ && onProgress_("Error getting Loot Assistant reports folder, skipping filtering...");
                setTimeout(() => onDone([]), 1500);
            });
    }

    function getExistingReports(reportIds, onDone) {
        lib.postApi('report/check-existing-reports', reportIds)
            .done((data) => {
                if (typeof data == 'string')
                    data = JSON.parse(data);
                if (data.length) {
                    // REPORTS_SKIPPED_OLD
                    onProgress_ && onProgress_('Found ' + data.length + ' previously uploaded reports, skipping these...');
                    setTimeout(() => onDone(data), 2000);
                } else {
                    onDone(data);
                }
            })
            .error(() => {
                if (lib.isUnloading())
                    return;

                // REPORTS_ERROR_CHECK_OLD
                onProgress_ && onProgress_('An error occurred while checking for existing reports, continuing...');
                setTimeout(() => onDone([]), 2000);
            });
    }

    function uploadReports(reportLinks) {
        requestManager.resetStats();

        reportLinks.forEach((link) => {
            requestManager.addRequest(link, (data, request) => {
                if (data) {
                    if (lib.checkContainsCaptcha(data)) {

                        if (requestManager.isRunning()) {
                            requestManager.stop();
                            
                            if (onProgress_)
                                onProgress_(lib.messages.TRIGGERED_CAPTCHA);

                            if (onDone_)
                                onDone_(lib.errorCodes.CAPTCHA);
                            else
                                alert(lib.messages.TRIGGERED_CAPTCHA);
                        }

                        return;
                    }

                    let $doc = lib.parseHtml(data);
                    try {
                        parseReportPage($doc, link, false, () => {
                            //  onError
                            requestManager.getStats().numFailed++;
                            //toggleReport($el, false);
                        });
                    } catch (e) {
                        requestManager.getStats().numFailed++;
                        console.log(e);
                    }
                    //toggleReport($el);
                }

                updateUploadsDisplay();
            });
        });

        requestManager.setFinishedHandler(() => {
            let stats = requestManager.getStats();

            // REPORTS_FINISHED
            let statusMessage = `Finished: ${stats.done}/${stats.total} uploaded, ${stats.numFailed} failed.`;
            if (onProgress_)
                onProgress_(statusMessage);

            if (!onDone_) {
                // REPORTS_FINISHED
                alert('Done!');
                let stats = requestManager.getStats();
                setUploadsDisplay(statusMessage);
            } else {
                onDone_(false);
            }
        });

        if (!requestManager.getStats().total) {
            lib.postApi('report/finished-report-uploads');

            if (!onDone_) {
                // REPORTS_NONE_NEW
                setUploadsDisplay('Finished: No new reports to upload.');
                // REPORTS_NONE_NEW
                alert('Finished: No new reports to upload!');
            } else {
                // REPORTS_NONE_NEW
                if (onProgress_)
                    onProgress_('Finished: No new reports to upload.');
                if (onDone_)
                    onDone_(false);
            }
        } else {
            requestManager.start();
        }
    }

    function makeUploadsDisplay() {
        if (onDone_ || onProgress_)
            return;

        $('#vault-uploads-display').remove();

        let $uploadsContainer = $('<div id="vault-uploads-display">');
        $doc.find('#report_list').parent().prepend($uploadsContainer);
        updateUploadsDisplay();
    }

    function updateUploadsDisplay() {
        let stats = requestManager.getStats();
        // REPORTS_PROGRESS
        let statusMessage = `Uploading ${stats.total} reports... (${stats.done} done, ${stats.numFailed} failed.)`;

        if (!onProgress_) {
            setUploadsDisplay(statusMessage);
        } else {
            onProgress_(statusMessage);
        }
    }

    function setUploadsDisplay(contents) {
        if (onDone_ || onProgress_)
            return;

        let $uploadsContainer = $doc.find('#vault-uploads-display');
        $uploadsContainer.text(contents);
    }

    function toggleReport($link, checked_) {
        if (onDone_ || onProgress_)
            return;

        if (typeof checked_ == 'undefined')
            checked_ = true;

        $link.closest('tr').find('td:first-of-type input').prop('checked', checked_);
    }

    function checkHasFilters() {
        let $filters = $doc.find('.report_filter');
        var hasFilters = false;

        let textFilter = $filters.find('input[type=text]').val();
        if (textFilter != null && textFilter.length > 0) {
            console.log('Text filter not empty');
            hasFilters = true;
        }

        let $checkedBoxes = $filters.find('input[type=checkbox]:checked');
        if ($checkedBoxes.length) {
            console.log('Checked boxes: ', $checkedBoxes);
            hasFilters = true;
        }

        let $checkedRadios = $filters.find('input[type=radio]:not([value=0]):checked');
        if ($checkedRadios.length) {
            console.log('Checked radios: ', $checkedRadios);
            hasFilters = true;
        }

        return hasFilters;
    }
}