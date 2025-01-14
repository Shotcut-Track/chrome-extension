let clickedLink = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getClickedLink") {
    clickedLink = request.link;
    sendResponse({ success: true });
  } else if (request.action === "getLongUrl") {
    sendResponse({ url: clickedLink });
    clickedLink = null;
  }
});