console.log("in background.js");
const HOST_URL = "https://choice-app-backend.herokuapp.com";
// TODO: whitelisted urls
// ############################## Blocker ##################################
// const BLOCKED_URLS = [
//     {
//         url: "https://www.youtube.com/watch?v=DXUAyRRkI6k",
//         tags: ["cats", "no dogs"],
//     },
//     {
//         url: "https://www.youtube.com/watch?v=R6Dw1bjC2uI",
//         tags: ["more", "cats"],
//     },
// ];

const isBlockedURL = async (url) => {
    try {
        // var myHeaders = new Headers();
        // myHeaders.append("Content-Type", "application/json");

        // var raw = JSON.stringify({
        //     url: url,
        // });

        // var requestOptions = {
        //     method: "POST",
        //     headers: myHeaders,
        //     body: raw,
        //     redirect: "follow",
        // };

        // const response = await fetch(
        //     "https://choice-app-backend.herokuapp.com/api/reports",
        //     requestOptions
        // );
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify({
            url: url,
        });

        var requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        let response = await fetch(
            "http://localhost:5000/api/reports",
            requestOptions
        );
        // .then((response) => response.text())
        // .then((result) => console.log(result))
        // .catch((error) => console.log("error", error));
        let { reply, data } = await response.json();
        let tags = new Set();
        console.log(data);
        data.forEach((element) => {
            element.categories.forEach((category) => {
                tags.add(category);
            });
        });
        return { reply, tags: Array.from(tags) };
    } catch (error) {
        console.log(error);
        return { reply: false, tags: null };
    }
    // for (blockedURL of BLOCKED_URLS) {
    //     console.log(blockedURL);
    //     console.log(blockedURL.url, url, url.includes(blockedURL.url));
    //     if (url.includes(blockedURL.url)) return blockedURL;
    // }
};

// Listen for when a Tab changes state
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo && changeInfo.status == "complete") {
        console.log("Tab updated: ", tabId, changeInfo, tab);
        const json = await isBlockedURL(tab.url);
        console.log(`blocked url = `, json);

        if (json.reply && !tab.url.includes("localhost:3000")) {
            console.log("Blocking", tab.url);
            chrome.tabs.sendMessage(tabId, {
                blockContent: true,
                redirectURL: `http://localhost:3000/seereport?url=${tab.url}`,
                blockedURL: tab.url,
                contains: json.tags.join(", "),
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
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create(contextMenuItem);
});
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
                            redirectURL: `http://localhost:3000/report?url=${clickData.pageUrl}`,
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
