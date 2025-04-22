use wasm_bindgen::prelude::*;
use web_sys::console;

// This function will be called from JavaScript to log actions.
#[wasm_bindgen]
pub fn log_action(action: &str) {
    console::log_1(&format!("Logged Action: {}", action).into());
}

// An example of another exported function
#[wasm_bindgen]
pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}
