// Dynamically import the WASM wrapper JS file using chrome.runtime.getURL
const wasmModuleUrl = chrome.runtime.getURL("wasm_sandbox.js");

import(wasmModuleUrl).then((wasmModule) => {
    // No need for init(), directly use the WASM functions after import
    // Log a test action to confirm the module is loaded
    // wasmModule.log_action("WASM Module Loaded");

    // Monitor and log actions on the page
    monitorActions();

    function monitorActions() {
        // Log clicks on the page
        document.addEventListener("click", event => {
            const actionData = {
                type: "click",
                target: event.target.tagName,
                timestamp: new Date().toISOString()
            };

            // Log the action using WASM
            wasmModule.log_action(JSON.stringify(actionData));
            console.log(actionData);
        });
    }
}).catch(err => {
    console.error("Error loading the WASM module:", err);
});
