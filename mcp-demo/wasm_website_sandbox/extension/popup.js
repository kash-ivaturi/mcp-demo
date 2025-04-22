document.getElementById("startSandboxButton").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "startSandbox" });
  });
  