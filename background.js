console.log("in background.js");
// TODO: whitelisted urls
// ############################## Blocker ##################################
const BLOCKED_URLS = [
    {
        url: "https://www.youtube.com/watch?v=DXUAyRRkI6k",
        tags: ["cats", "no dogs"],
    },
    {
        url: "https://www.youtube.com/watch?v=R6Dw1bjC2uI",
        tags: ["more", "cats"],
    },
];

const isBlockedURL = (url) => {
    for (blockedURL of BLOCKED_URLS) {
        console.log(blockedURL);
        console.log(blockedURL.url, url, url.includes(blockedURL.url));
        if (url.includes(blockedURL.url)) return blockedURL;
    }
    return false;
};

// Listen for when a Tab changes state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo && changeInfo.status == "complete") {
        console.log("Tab updated: ", tabId, changeInfo, tab);
        const blockedURL = isBlockedURL(tab.url);
        console.log(`blocked url = ${blockedURL}`);

        if (blockedURL) {
            console.log("Blocking", tab.url);
            chrome.tabs.sendMessage(tabId, {
                blockContent: true,
                redirectURL: `http://localhost:3000/home/?url=${tab.url}`,
                blockedURL: tab.url,
                contains: blockedURL.tags.join(", "),
            });
        } else {
            console.log("Unblocking", tab.url);
            chrome.tabs.sendMessage(tabId, { blockContent: false });
        }
    }
});

// ############################## Context Menu #############################
let contextMenuItem = {
    id: "reportRedirect",
    title: "Report Video in Page",
    contexts: ["all"],
};
chrome.contextMenus.create(contextMenuItem);
chrome.contextMenus.onClicked.addListener((clickData) => {
    console.log(clickData);
    if (clickData.menuItemId === "reportRedirect") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    getInfo: true,
                },
                (response) => {
                    if (response.videoElementPresent) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            redirect: true,
                            redirectURL: `http://localhost:3000/home/?url=${clickData.pageUrl}`,
                        });
                    } else {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: "alert",
                            message:
                                "Could not find any video element in the page.",
                        });
                    }
                }
            );
        });
    }
});
