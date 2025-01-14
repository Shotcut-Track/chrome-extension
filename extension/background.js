chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "pusShortenLink",
    title: "Shorten Link",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pusShortenLink") {
    chrome.tabs.sendMessage(tab.id, { action: "getClickedLink", link: info.linkUrl }, (response) => {
      chrome.action.openPopup();
      chrome.runtime.sendMessage({ action: "setLongUrl", url: info.linkUrl });
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!chrome.runtime.lastError  && request.action === "popupReady") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getLongUrl" }, (response) => {
        if (response && response.url) {
          sendResponse({ url: response.url });
        }
      });
    });
    return true;
  }
});