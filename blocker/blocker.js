console.log("in blocker.js");

let tobeblocked = false;
let blockedURL;
let blocking = false;

const blocker = document.createElement("div");
blocker.className = "blocker";

const logoContainer = document.createElement("div");
logoContainer.className = "logo-container";
const logo = document.createElement("img");
logo.className = "logo";
logo.src =
    "https://dl3.pushbulletusercontent.com/JB9r9Ex6qNqtfD3wgjFBvJQtTMhIFR9V/icon.svg";
logoContainer.appendChild(logo);
blocker.appendChild(logoContainer);

const tooltip = document.createElement("div");
tooltip.className = "tooltip";
const textContainer = document.createElement("div");
textContainer.className = "text-container";
textContainer.innerText =
    "This video might contain unethical content. Click to find out more.";
tooltip.appendChild(textContainer);
const tooltiptext = document.createElement("span");
tooltiptext.className = "tooltiptext";
tooltip.appendChild(tooltiptext);
blocker.appendChild(tooltip);
console.log("IN BLOCKER.JS");

const renderBlocker = (videoPlayer) => {
    if (
        tobeblocked &&
        blockedURL === window.location.href &&
        videoPlayer !== null
    ) {
        console.log(`blocking `);
        const {
            x,
            y,
            width,
            height,
            top,
            right,
            bottom,
            left,
        } = videoPlayer.getBoundingClientRect();
        blocker.style.width = `${width + 5}px`;
        blocker.style.height = `${height + 5}px`;
        blocker.style.top = `${top}px`;
        blocker.style.left = `${left}px`;
        videoPlayer.pause();
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.blockContent === true) {
        tobeblocked = true;
        blockedURL = request.blockedURL;
        let videoPlayer;
        videoPlayer = document.querySelector("video");
        setInterval(() => {
            if (tobeblocked) {
                videoPlayer = document.querySelector("video");
                videoPlayer.pause();
            }
        }, 5000);

        if (request.redirectURL !== undefined) {
            if (tobeblocked) {
                blocker.onclick = () => {
                    window.open(request.redirectURL, "_blank");
                    tobeblocked = false;
                    document.body.removeChild(blocker);
                };
            }
        }
        document.body.insertBefore(blocker, document.body.children[0]);
        setInterval(() => {
            renderBlocker(videoPlayer);
        }, 50);
        window.onscroll = () => {
            // renderBlocker(videoPlayer);
            renderBlocker(videoPlayer);
        };
        window.onchange = () => {
            renderBlocker(videoPlayer);
        };
        window.onresize = () => {
            renderBlocker(videoPlayer);
        };
        videoPlayer.onplay = () => {
            // setTimeout(() => {
            // }, 3000);
            // console.log("setting blocking to true");
            // blocking = true;
            renderBlocker(videoPlayer);
        };
        if (request.contains !== undefined) {
            if (tobeblocked) {
                document.querySelector(
                    ".tooltiptext"
                ).innerText = `This video has been reported as it contains: ${request.contains}`;
            }
        }
    } else if (request.blockContent === false) {
        tobeblocked = false;
        document.body.removeChild(blocker);
    }
    if (request.getInfo === true) {
        console.log("getting info");
        if (document.querySelector("video")) {
            sendResponse({ videoElementPresent: true });
        } else {
            sendResponse({ videoElementPresent: false });
        }
        return true;
    }
    if (request.redirect === true) {
        window.open(request.redirectURL, "_blank");
    }
    if (request.type === "alert") {
        alert(request.message);
    }
});
