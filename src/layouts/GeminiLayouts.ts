import { LitElement, css, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { CUSTOM_KEY, getSecrets, initGeminiModels, saveKey, STATE, throwGeminiError, } from '../utils';
import {
    writeSecret,
} from "@silly-tavern/scripts/secrets.js";
interface GeminiLayoutsOption {
    currentKey: string;
    lastKey: string;
    throwGeminiErrorState: boolean;
    switchKeyMakerSuite: boolean;
    apiKeys: string;
}

export class GeminiLayouts extends LitElement {
    static properties = {
        currentKey: { type: String, reflect: true },
        lastKey: { type: String, reflect: true },
        throwGeminiErrorState: { type: Boolean, reflect: true },
        switchKeyMakerSuite: { type: Boolean, reflect: true },
        apiKeys: { type: String, reflect: true },
    }
    declare currentKey: string;
    declare lastKey: string;
    declare throwGeminiErrorState: boolean;
    declare switchKeyMakerSuite: boolean;
    declare apiKeys: string;
    constructor() {
        super();
        this.currentKey = "";
        this.lastKey = "";
        this.throwGeminiErrorState = false;
        this.switchKeyMakerSuite = false;
        this.apiKeys = "";
    }
    protected createRenderRoot(): HTMLElement | DocumentFragment {
        return this;
    }
    render() {
        console.log('GeminiLayouts render');
        console.log("this", this);
        const buttons = [
            {
                name: "Save Key",
                handle: this.handleSaveKey
            },
            {
                name: "Fetch New Model",
                handle: this.handleGetNewModel
            },
            {
                name: "Key Rotation Settings",
                handle: this.handleSwitchKeyMakerSuite
            },
            {
                name: "View Error Explanations",
                handle: this.handleThrowGeminiError
            },
            {
                name: "Error Explanation Switch",
                handle: this.handleSwitchGeminiError
            }
        ]
        return html`
        <div>
            <h4>Key Usage Info:</h4>
            <div id="current_key_maker_suite">Current: ${this.currentKey}</div>
            <div id="last_key_maker_suite">Previous: ${this.lastKey}</div>
            <div id="switch_key_maker_suite">Key Rotation: ${this.switchKeyMakerSuite ? "On" : "Off"}</div>
            <div id="throw_gemini_error">Error Explanation: ${this.throwGeminiErrorState ? "On" : "Off"}</div>
        </div>
        <div class="flex-container flex">
            <h4>Google AI Studio API Keys</h4>
            <textarea class="text_pole textarea_compact autoSetHeight" placeholder="API Key"
            id="api_key_makersuite_custom" style="height: 100px;" @change=${this.handleTextareaInput} .value=${this.apiKeys}></textarea>
        </div>
        <div class="flex-container flex">
        ${repeat(
            buttons,
            ({ name }) => name,
            ({ name, handle }) => html`
                <div class="menu_button menu_button_icon interactable" title="${name}" @click="${handle}"><span>${name}</span></div>`,
        )}
        </div>
        <hr>
        `;
    }
    handleTextareaInput(event: Event) {
        console.log('handleTextareaInput', event);
        const textarea = event.target as HTMLTextAreaElement;

        const value = textarea.value
            .split(/[\n;]/)
            .map((v) => v.trim())
            .filter((v) => v.length > 0 && v.startsWith("AIzaSy"));

        this.apiKeys = value.join("\n");
        textarea.value = this.apiKeys;
        if (value.length === 0) {
            saveKey(CUSTOM_KEY, this.apiKeys);
            return;
        }
        const fistValue = value[0];
        writeSecret("api_key_makersuite", fistValue);
        saveKey(CUSTOM_KEY, this.apiKeys);
        // this.requestUpdate();
    }
    handleThrowGeminiError() {
        console.log('handleThrowGeminiError');
        throwGeminiError();
    }

    async handleGetNewModel() {
        console.log('handleGetNewModel');
        const secrets = await getSecrets();
        await initGeminiModels(secrets);
    }
    handleSaveKey() {
        console.log('handleSaveKey');
        const value = this.apiKeys
        if (value.length === 0) {
            saveKey(CUSTOM_KEY, value);
            return;
        }
        const fistValue = value[0];
        writeSecret("api_key_makersuite", fistValue);
        saveKey(CUSTOM_KEY, this.apiKeys);

    }
    handleSwitchKeyMakerSuite() {
        // (implementation stays the same)
    }
    handleSwitchGeminiError() {
        // (implementation stays the same)
    }
}
