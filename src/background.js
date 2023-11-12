/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Create block listener
 * @async
 */
async function createBlocker() {
    // Remove previous listener
    browser.webRequest.onBeforeRequest.removeListener(block);

    // Load URLs from storage
    const storage = await browser.storage.sync.get();
    showError = (typeof storage.showError == 'boolean') ? storage.showError : true;
    blockOff = (typeof storage.allowTemporarily == 'boolean') ? storage.allowTemporarily : false;

    // Check if there are URLs to load
    if (storage.urlList) {
        // Create listener
        if (storage.urlList.length > 0 && !blockOff) {
            browser.webRequest.onBeforeRequest.addListener(block, {
                urls: storage.urlList
            }, ["blocking"]);
        }
    }
}

/**
 * Handle blocked URL
 * @param {Object} requestDetails
 */
function block(requestDetails) {
    if (showError) {
        return {
            redirectUrl: browser.runtime.getURL('/blocked/blockpage.html')
        };
    } else {
        return {
            cancel: true
        };
    }
}

/**
 * Handles missing storage data
 * @async
 */
async function checkData() {
    // Load URLs from storage
    let data = await browser.storage.sync.get();

    // Create blank URL list in storage if required
    if (!data.urlList) {
        browser.storage.sync.set({
            urlList: []
        });
    }
}
async function getData() {
    const result = await browser.storage.sync.get();
    console.log(result);
}
  

/**
 * Handle incoming runtime messages
 * @param {Object} message
 */
function handleMessage(message) {
    if (typeof message.target == 'string' && message.target != 'background') {
        return;
    }
    switch (message.command.toUpperCase()) {
        case 'FEEDBACK':
            openFeedback();
            break;
        case 'ALLOW_TEMPORARILY':
            handleTemporaryAllowance(message.allowTemporarily);
            break;
        case 'CLOSE_TASKS_PAGE': // Added case for closing tasks page
            closeTasksPage();
            break;
        case 'CREATE_TASKS_PAGE': // Added case for closing tasks page
            createTasksPage();
            break;
    }
}

/**
 * Handle temporary allowance
 * @param {boolean} allowTemporarily
 */
async function handleTemporaryAllowance(allowTemporarily) {
    const storage = await browser.storage.sync.get();

    browser.storage.sync.set({
        allowTemporarily: allowTemporarily
    });
    if (allowTemporarily) {
        browser.tabs.query({ url: browser.runtime.getURL('/blocked/blockpage.html') }, (tabs) => {
            tabs.forEach((tab) => {
                browser.tabs.remove(tab.id);
            });
        });

        const resetTime = storage.resetTime || '08:00'; // Default to 8:00 AM
        const taskTime = storage.taskTime || '21:00'; // Default to 9:00 PM

        const now = new Date();
        const resetTimeDate = new Date(now);
        resetTimeDate.setHours(parseInt(resetTime.split(':')[0]), parseInt(resetTime.split(':')[1]), 0, 0);
        //resetTimeDate.setSeconds(now.getSeconds() + 30); // Set to 10 seconds from now for testing

        let timeoutDuration = resetTimeDate - now;

        // If it's already past 8:00 AM, set the timeout for the next day
        if (timeoutDuration < 0) {
            resetTimeDate.setDate(resetTimeDate.getDate() + 1);
            timeoutDuration = resetTimeDate - now;
        }
        // Set a timer to revert temporary allowance at 8:00AM
        setTimeout(() => {
            browser.storage.sync.set({
                allowTemporarily: false
            });
            closeTasksPage();
            createBlocker();
        }, timeoutDuration); 

        // Set a timer to open tasks page at 9:00 PM every night
        const taskTimeDate = new Date(now);
        taskTimeDate.setHours(parseInt(taskTime.split(':')[0]), parseInt(taskTime.split(':')[1]), 0, 0);
        //taskTimeDate.setSeconds(now.getSeconds() + 15); // Set to 10 seconds from now for testing

        // If it's already past 9:00 PM, open tasks page immediately
        if (taskTimeDate < now) {
            createTasksPage();
        } else {
            setTimeout(() => {
                createTasksPage();
            }, taskTimeDate - now);
        }
    }

    // Update the blocker immediately
    createBlocker();
}
/**
 * Create a new tab for tasks at 9:00 PM every night
 */
function createTasksPage() {
    getSystemDetails((details) => {
        browser.windows.create({
            height: 500,
            width: 600,
            type: browser.windows.CreateType.NORMAL,
            url: browser.runtime.getURL('/tasks/tasks.html')
        });
    });
}

/**
 * Close tasks page
 */
function closeTasksPage() {
    
    browser.tabs.query({ url: browser.runtime.getURL('/tasks/tasks.html') }, (tabs) => {
        tabs.forEach((tab) => {
            browser.tabs.remove(tab.id);
        });
    });
}

/**
 * Handles the installation/update of the add-on
 */
function handleInstalled(details) {
    if (details.reason == 'install') {
        browser.runtime.openOptionsPage();
    }
}

/**
 * Set up uninstall page
 */
 function setUninstallPage() {
    getSystemDetails((details) => {
        browser.runtime.setUninstallURL(`${webBase}/uninstall/?browser=${details.browser}&os=${details.os}&version=${details.version}`);
    });
}

/**
 * Open feedback window
 */
function openFeedback() {
    getSystemDetails((details) => {
        browser.windows.create({
            height: 700,
            width: 450,
            type: browser.windows.CreateType.PANEL,
            url: `${webBase}/feedback/?browser=${details.browser}&os=${details.os}&version=${details.version}`
        });
    });
}

/**
 * Send system details to callback
 * @param {Function} callback
 */
function getSystemDetails(callback) {
    browser.runtime.getPlatformInfo((platform) => {
        callback({
            browser: 'firefox',
            version: browser.runtime.getManifest().version,
            os: platform.os
        });
    });
}

const webBase = 'https://addons.wesleybranton.com/addon/website-blocker';
let filter = [];
let showError = true;
let blockOff = false;
createBlocker();
browser.storage.onChanged.addListener(createBlocker);
browser.runtime.onInstalled.addListener(handleInstalled);
browser.runtime.onMessage.addListener(handleMessage);
browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
});
checkData();
setUninstallPage();
