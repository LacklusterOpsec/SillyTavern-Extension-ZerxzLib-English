const currentKeyElement = $("#current_key_maker_suite")[0] as HTMLSpanElement;
const lastKeyElement = $("#last_key_maker_suite")[0] as HTMLSpanElement;
console.log("textarea", textarea);
console.log("api_keys", api_keys);
if (!textarea) {
    return;
}
currentKeyElement.textContent = `Current Key: ${firstKeyApi}`;
lastKeyElement.textContent = `Previous Key: ${currentKey}`;

textarea.value = api_keys.join("\n");
