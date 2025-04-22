chrome.runtime.onInstalled.addListener(() => {
    console.log("WASM Website Sandbox extension installed.");
  });
  
  // Listen for messages to control sandboxing
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startSandbox") {
      chrome.tabs.executeScript(sender.tab.id, {
        file: "content.js"
      });
    }
  });
  