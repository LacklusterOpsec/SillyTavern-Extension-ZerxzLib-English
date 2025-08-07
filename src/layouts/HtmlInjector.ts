import { LitElement, html, type PropertyDeclarations } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import { SignalWatcher, signal, watch } from '@lit-labs/signals';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';
import { useExtensionSetting } from '../utils/extension';
import { htmlInjectorSettings } from 'utils/setting';
const { saveSettingsDebounced, extensionSettings, setSetting, getSettings, getSignals } = htmlInjectorSettings
// This function is called when the extension settings are changed in the UI
function onExampleInput() {
    extensionSettings.example_setting = "test";
    saveSettingsDebounced();
    setSetting('example_setting2', 'test');
}
const {
    lastMesTextContent,
    isInjectionEnabled,
    displayMode,
    activationMode,
    customStartFloor,
    customEndFloor,
    savedPosition,
    isEdgeControlsCollapsed,
    isVisibleSettingsPanel,
    saveTopPosition,
    hiddenEdgeControls,
} = getSignals();
// ---------------------------------------- Global Variables --------------------------------
const chatElement = $<HTMLDivElement>('#chat');
const observer = new MutationObserver((mutations) => {
    let canInject = false;
    for (const mutation of mutations) {
        if (mutation.type !== 'childList') {
            continue;
        }
        const hasNewMesText = Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType !== Node.ELEMENT_NODE || !(node instanceof HTMLElement)) {
                return false;
            }
            return node.classList.contains('mes_text') || node.querySelector('.mes_text');
        });

        if (hasNewMesText) {

            if (isInjectionEnabled.get()) {
                canInject = true;

            }
            break;
        }
    }
    if (canInject) {
        removeInjectedIframes();
        injectHtmlCode();
    }
});
// ---------------------------------------- Initialization ----------------------------------------
class IFrameManager {
    private static instance: IFrameManager;
    private resizeObservers: Map<HTMLIFrameElement, ResizeObserver> = new Map();

    private constructor() { }

    public static getInstance(): IFrameManager {
        if (!IFrameManager.instance) {
            IFrameManager.instance = new IFrameManager();
        }
        return IFrameManager.instance;
    }

    public createIframe(htmlContent: string): HTMLIFrameElement {
        const iframe = document.createElement('iframe');
        this.setupIframeAttributes(iframe);
        iframe.srcdoc = this.getIframeSrcContent(htmlContent);

        this.setupIframeEventListeners(iframe);
        return iframe;
    }

    private setupIframeAttributes(iframe: HTMLIFrameElement): void {
        Object.assign(iframe.style, {
            width: '100%',
            border: 'none',
            marginTop: '10px',
            transition: 'height 0.3s ease' // Add smooth transition effect
        });
    }

    private setupIframeEventListeners(iframe: HTMLIFrameElement): void {
        iframe.onload = () => {
            this.adjustIframeHeight(iframe);
            // Delay adjustment to ensure content is fully loaded
            setTimeout(() => this.adjustIframeHeight(iframe), 500);

            // Set initial theme
            this.updateIframeTheme(iframe, getSystemTheme());
        };

        // Create and store ResizeObserver
        if (iframe.contentWindow) {
            const resizeObserver = new ResizeObserver(() => this.adjustIframeHeight(iframe));
            this.resizeObservers.set(iframe, resizeObserver);

            iframe.addEventListener('load', () => {
                if (iframe.contentWindow?.document.body) {
                    resizeObserver.observe(iframe.contentWindow.document.body);
                }
            });
        }
    }

    public adjustIframeHeight(iframe: HTMLIFrameElement): void {
        try {
            if (iframe.contentWindow?.document.body) {
                const height = Math.max(
                    iframe.contentWindow.document.documentElement.scrollHeight,
                    iframe.contentWindow.document.body.scrollHeight
                );
                iframe.style.height = `${height + 5}px`;
            }
        } catch (error) {
            console.error('Failed to adjust iframe height:', error);
        }
    }

    public updateIframeTheme(iframe: HTMLIFrameElement, theme: string): void {
        try {
            iframe.contentWindow?.postMessage({ type: 'themeChange', theme }, '*');
        } catch (error) {
            console.error('Failed to update iframe theme:', error);
        }
    }

    public removeIframe(iframe: HTMLIFrameElement): void {
        // Clean up ResizeObserver
        const observer = this.resizeObservers.get(iframe);
        if (observer) {
            observer.disconnect();
            this.resizeObservers.delete(iframe);
        }
        iframe.remove();
    }

    private getIframeSrcContent(htmlContent: string): string {
        return `
            <html>
    <head>
        <style>
            /* Custom styles */
            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            ::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.5);
            }
            [data-theme="dark"] ::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
            }
            [data-theme="dark"] ::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
            }
            [data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
            }
            .container[data-theme="light"] {
                --bg-color: rgba(240, 240, 255, 0.1);
                --text-color: #1e1e1e;
                --border-color: rgba(139,226,115,0.3);
                --nav-bg-color: rgba(240,240,255,0.4);
            }
            .container[data-theme="dark"] {
                --bg-color: rgba(40, 40, 40, 0.2);
                --text-color: #e0e0e0;
                --border-color: rgba(74,74,74,0.3);
                --nav-bg-color: rgba(30,30,30,0.4);
            }
            .container {
                background-color: var(--bg-color);
                color: var(--text-color);
            }
            .container .left-nav {
                background-color: var(--nav-bg-color);
            }
            .container .button, .container .left-nav .section {
                border: 1px solid var(--border-color);
            }
        </style>
    </head>
    <body>
        <div class="theme-content">
            ${htmlContent}
        </div>
        <script>
            window.addEventListener('load', function() {
                window.parent.postMessage('loaded', '*');
                const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                function handleThemeChange(e) {
                    document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                    window.parent.postMessage({type: 'themeChange', theme: e.matches ? 'dark' : 'light'}, '*');
                }
                darkModeMediaQuery.addListener(handleThemeChange);
                handleThemeChange(darkModeMediaQuery);
                document.querySelectorAll('.qr-button').forEach(button => {
                    button.addEventListener('click', function() {
                        const buttonName = this.textContent.trim();
                        window.parent.postMessage({type: 'buttonClick', name: buttonName}, '*');
                    });
                });
                document.querySelectorAll('.st-text').forEach(textarea => {
                    textarea.addEventListener('input', function() {
                        window.parent.postMessage({type: 'textInput', text: this.value}, '*');
                    });
                    textarea.addEventListener('change', function() {
                        window.parent.postMessage({type: 'textInput', text: this.value}, '*');
                    });
                    const observer = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => {
                            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                                window.parent.postMessage({type: 'textInput', text: textarea.value}, '*');
                            }
                        });
                    });
                    observer.observe(textarea, { attributes: true });
                });
                document.querySelectorAll('.st-send-button').forEach(button => {
                    button.addEventListener('click', function() {
                        window.parent.postMessage({type: 'sendClick'}, '*');
                    });
                });
            });
            window.addEventListener('message', function(event) {
                if (event.data.type === 'themeChange') {
                    document.body.setAttribute('data-theme', event.data.theme);
                }
            });
        </script>
    </body>
</html>
        `;
    }
}



// Modified removeInjectedIframes function
function removeInjectedIframes() {
    const iframeManager = IFrameManager.getInstance();
    const iframes = document.querySelectorAll<HTMLIFrameElement>('.mes_text iframe');
    for (const iframe of Array.from(iframes)) {
        iframeManager.removeIframe(iframe);
    }
    const codeElements = document.querySelectorAll<HTMLDivElement>('.mes_text code');
    for (const code of Array.from(codeElements)) {
        code.style.display = '';
        const details = code.closest('details');
        if (details) {
            details.parentNode?.insertBefore(code, details);
            details.remove();
        }
    }
}
function injectHtmlCode(specificMesText = null as Element | null) {
    console.log('injectHtmlCode');
    try {
        const mesTextElements = specificMesText ? [specificMesText] : Array.from(chatElement.find('.mes_text'));
        let targetElements: Element[];
        const iframeManager = IFrameManager.getInstance();
        switch (activationMode.get()) {
            case 'first':
                targetElements = mesTextElements.slice(0, 1);
                break;
            case 'last':
                targetElements = mesTextElements.slice(-1);
                break;
            case 'lastN':
                targetElements = mesTextElements.slice(-customEndFloor);
                break;
            case 'custom': {
                const start = customStartFloor.get() - 1;
                const end = customEndFloor.get() === -1 ? undefined : customEndFloor.get();
                targetElements = mesTextElements.slice(start, end);
                break;
            }
            default: // 'all'
                targetElements = mesTextElements;
        }
        for (let i = 0; i < targetElements.length; i++) {
            const mesText = targetElements[i];
            const codeElement = mesText.querySelector('code');
            if (!codeElement) {
                continue;
            }
            const htmlContent = codeElement.innerText.trim();
            if (!htmlContent.startsWith("<") || !htmlContent.endsWith(">")) {
                continue;
            }
            const iframe = iframeManager.createIframe(htmlContent);
            if (displayMode.get() === 2) {
                const details = document.createElement('details');
                const summary = document.createElement('summary');
                summary.textContent = '[Original Code]';
                details.appendChild(summary);
                codeElement.parentNode?.insertBefore(details, codeElement);
                details.appendChild(codeElement);
            } else if (displayMode.get() === 3) {
                codeElement.style.display = 'none';
            }
            codeElement.parentNode?.insertBefore(iframe, codeElement.nextSibling);

            mesText.appendChild(iframe);
        }
    } catch (error) {
        console.error('HTML injection failed:', error);
    }
}

// ---------------------------------------- Helper Functions ----------------------------------------
function adjustIframeHeight(iframe: HTMLIFrameElement) {
    try {
        if (iframe.contentWindow?.document.body) {
            const height = iframe.contentWindow.document.documentElement.scrollHeight;
            iframe.style.height = `${height + 5}px`;
        }
    } catch (error) {
        console.error('Failed to adjust iframe height:', error);
    }
}
function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function updateAllIframesTheme() {
    const iframes = document.querySelectorAll('.mes_text iframe');
    // biome-ignore lint/complexity/noForEach: <explanation>
    iframes.forEach(iframe => {
        try {
            // @ts-ignore
            if (iframe.contentWindow) {
                // @ts-ignore
                iframe.contentWindow.postMessage({ type: 'themeChange', theme: getSystemTheme() }, '*');
            }
        } catch (error) {
            console.error('Failed to update iframe theme:', error);
        }
    });
}

function handleMessage(event: MessageEvent) {
    try {
        if (event.data === 'loaded') {
            const iframes = document.querySelectorAll<HTMLIFrameElement>('.mes_text iframe');
            // biome-ignore lint/complexity/noForEach: <explanation>
            iframes.forEach(iframe => {
                // @ts-ignore
                if (iframe.contentWindow === event.source) {
                    adjustIframeHeight(iframe);
                }
            });
        } else if (event.data.type === 'buttonClick') {
            const buttonName = event.data.name;
            jQuery('.qr--button.menu_button').each(function () {
                if (jQuery(this).find('.qr--button-label').text().trim() === buttonName) {
                    jQuery(this).trigger('click');
                    return false;
                }
            });
        } else if (event.data.type === 'textInput') {
            const sendTextarea = document.getElementById('send_textarea');
            if (sendTextarea) {
                // @ts-ignore
                sendTextarea.value = event.data.text;
                sendTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                sendTextarea.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else if (event.data.type === 'sendClick') {
            const sendButton = document.getElementById('send_but');
            if (sendButton) {
                sendButton.click();
            }
        }
    } catch (error) {
        console.error('Failed to handle message:', error);
    }
}
class SettingsPanel extends SignalWatcher(LitElement) {
    protected createRenderRoot(): HTMLElement | DocumentFragment {
        return this;
    }
    public customFloorSettingsRef = createRef<HTMLDivElement>();
    public LastSettingsRef = createRef<HTMLDivElement>();
    declare edgeControls: EdgeControls
    render() {
        this.style.display = isVisibleSettingsPanel.get() ? 'none' : 'block';
        this.classList.add('drawer');
        return html`
        <div id="html-injector-settings-header" class="inline-drawer-header">
                <span class="inline-drawer-title">HTML Injector Settings</span>
                <div id="html-injector-close-settings" class="inline-drawer-icon fa-solid fa-circle-xmark" @click=${this.toggleSettingsPanel}></div>
            </div>
            <div id="settings-content">
                <div class="settings-section">
                    <h3 class="settings-subtitle">Edge Control Panel Position</h3>
                <select id="edge-controls-position" class="settings-select theme-element" @change=${this.handleSavePositionChange}>
                    <option value="top-right"            .selected=${savedPosition.get() === "top-right"}>Top Right of Interface</option>
                    <option value="right-three-quarters" .selected=${savedPosition.get() === "right-three-quarters"}>Right Side 3/4 Position</option>
                    <option value="right-middle"         .selected=${savedPosition.get() === "right-middle"}>Right Side Middle</option>
                    <option value="top-left"             .selected=${savedPosition.get() === "top-left"}>Top Left of Interface</option>
                    <option value="left-three-quarters"  .selected=${savedPosition.get() === "left-three-quarters"}>Left Side 3/4 Position</option>
                    <option value="left-middle"          .selected=${savedPosition.get() === "left-middle"}>Left Side Middle</option>
                    <option value="custom"               .selected=${savedPosition.get() === "custom"}>Custom Position</option>
                    <option value="hidden"               .selected=${savedPosition.get() === "hidden"}>Hidden</option>

                </select>
                </div>
                <div class="settings-section">
                <h3 class="settings-subtitle">Display Mode</h3>
                <label class="settings-option"><input type="radio" name="display-mode" value="1" .checked=${displayMode.get() === 1} @change=${this.handleDisplayModeChange}> Original code and injection effect</label>
                <label class="settings-option"><input type="radio" name="display-mode" value="2" .checked=${displayMode.get() === 2} @change=${this.handleDisplayModeChange}> Original code as summary</label>
                <label class="settings-option"><input type="radio" name="display-mode" value="3" .checked=${displayMode.get() === 3} @change=${this.handleDisplayModeChange}> Hide original code, only show effect</label>
            </div>
                <div class="settings-section">
                    <h3 class="settings-subtitle">Active Levels</h3>
                    <select id="activation-mode" class="settings-select theme-element" @change=${this.handleActivationModeChange} >
                        <option value="all"    .selected=${activationMode.get() === "all"}>All Levels</option>
                        <option value="first"  .selected=${activationMode.get() === "first"}>First Level</option>
                        <option value="last"   .selected=${activationMode.get() === "last"}>Last Level</option>
                        <option value="lastN"  .selected=${activationMode.get() === "lastN"}>Last N Levels</option>
                        <option value="custom" .selected=${activationMode.get() === "custom"}>Custom Levels</option>
                    </select>
                    <div id="custom-floor-settings" class="settings-subsection" style=${styleMap({
            display: activationMode.get() === 'custom' ? 'block' : 'none'
        })} ${ref(this.customFloorSettingsRef)}>
                        <label class="settings-option">Start Level: <input type="number" id="custom-start-floor" min="1" .value=${customStartFloor.get().toString()} @change=${this.handleCustomStartFloorChange}></label>
                        <label class="settings-option">End Level: <input type="number" id="custom-end-floor" min="-1" .value=${customEndFloor.get().toString()} @change=${this.handleCustomEndFloorChange}></label>
                        <p class="settings-note">(-1 means the last level)</p>
                    </div>
                    <div id="last-n-settings" class="settings-subsection" style=${styleMap({
            display: activationMode.get() === 'lastN' ? 'block' : 'none'
        })} ${ref(this.LastSettingsRef)} >
                        <label class="settings-option">Last <input type="number" id="last-n-floors" min="1" .value=${customEndFloor.get().toString()}  @change=${this.handleLastNFloorsChange}> Levels</label>
                    </div>
                </div>
            </div>
            <div class="settings-footer">
                <p>Security Reminder: Only inject code you trust. Unsafe code may pose potential risks to your system.</p>
                <p>Note: The HTML code to be injected should be wrapped with \`\`\`, for example:</p>
                <pre class="code-example">
\`\`\`
&lt;h1&gt;Hello, World!&lt;/h1&gt;
&lt;p&gt;This is an example.&lt;/p&gt;
\`\`\`
        </pre>
        <p>The following are special class names corresponding to ST Tavern features and simple usage:</p>
        <pre class="code-example">
\`\`\`
&lt;button class="qr-button"&gt;(Your QR button name)&lt;/button&gt;
&lt;textarea class="st-text"&gt;(Corresponds to Tavern's input text box, input will sync to Tavern's box)&lt;/textarea&gt;
&lt;button class="st-send-button"&gt;(Corresponds to Tavern's send button)&lt;/button&gt;
\`\`\`
                </pre>
                <p>[Note] Synchronizing dynamically inserted content of st-text box to Tavern's input box requires some time. If you need to sync, please add a small delay to ensure the text has time to sync.</p>
                <a href="https://discord.com/channels/1134557553011998840/1271783456690409554" target="_blank"> →Discord tutorial post← with detailed explanations and gal interface templates </a>
            </div>
        `
    }
    handleActivationModeChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const value = target.value;
        activationMode.set(value);
        this.updateInjection();
    }
    handleSavePositionChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const value = target.value;
        savedPosition.set(value);
        isEdgeControlsCollapsed.set(false);
        this.edgeControls.updateEdgeControlsPosition(value);
    }
    handleCustomStartFloorChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = Number.parseInt(target.value);
        customStartFloor.set(value);
        this.updateInjection();
    }

    handleCustomEndFloorChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = Number.parseInt(target.value);
        customEndFloor.set(value);
        this.updateInjection();
    }
    handleLastNFloorsChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = Number.parseInt(target.value);
        customEndFloor.set(value);
        this.updateInjection();
    }
    handleDisplayModeChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = Number.parseInt(target.value);
        displayMode.set(value);
        this.updateInjection();
    }
    toggleSettingsPanel(event: Event) {
        const isVisible = this.style.display === 'block';
        this.style.display = isVisible ? 'block' : 'node';
        isVisibleSettingsPanel.set(isVisible);
    }
    updateInjection() {
        if (!isInjectionEnabled.get()) {
            return
        }
        removeInjectedIframes();
        injectHtmlCode();
    }
}
class EdgeControls extends SignalWatcher(LitElement) {
    static properties: PropertyDeclarations = {
        settingsPanel: { type: Object },
        toggleEdgeButtonStyle: { type: Object },
        isDragging: { type: Boolean },
        startY: { type: Number },
        startTop: { type: Number },
        newTop: { type: Number }
    }
    public declare settingsPanel: SettingsPanel;
    public declare toggleEdgeButtonStyle: StyleInfo;
    public declare isDragging: boolean;
    public declare startY: number;
    public declare startTop: number;
    public newTop: number
    constructor() {
        super();
        const position = savedPosition.get();
        const isLeft = position.includes('left');
        this.toggleEdgeButtonStyle = {
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'var(--SmartThemeBlurTintColor, rgba(22, 11, 18, 0.73))',
            color: 'var(--SmartThemeBodyColor, rgba(220, 220, 210, 1))',
            border: '1px solid var(--SmartThemeBorderColor, rgba(217, 90, 157, 0.5))',
            cursor: 'pointer',
            padding: '5px',
            userSelect: 'none',
            fontSize: '12px',
            height: '60px',
            width: '20px',
            textAlign: 'center',
            ...(isLeft ? {
                right: '-20px',
                left: 'auto',
                borderRadius: '0 5px 5px 0'
            } : {
                left: '-20px',
                right: 'auto',
                borderRadius: '5px 0 0 5px'
            })
        }
        this.isDragging = false;
        this.startY = 0;
        this.startTop = 0;
        this.newTop = 0;


    }
    protected createRenderRoot(): HTMLElement | DocumentFragment {
        return this;
    }
    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('mousemove', this.handleDragMove.bind(this));
        // @ts-ignore
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));
        document.addEventListener('touchmove', this.handleDragMove.bind(this));
        // @ts-ignore
        document.addEventListener('touchend', this.handleDragEnd.bind(this));
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('mousemove', this.handleDragMove.bind(this));
        // @ts-ignore
        document.removeEventListener('mouseup', this.handleDragEnd.bind(this));
        document.removeEventListener('touchmove', this.handleDragMove.bind(this));
        // @ts-ignore
        document.removeEventListener('touchend', this.handleDragEnd.bind(this));
    }
    protected render(): unknown {
        console.log('render edge controls');
        console.log('isInjectionEnabled', isInjectionEnabled.get());
        console.log('isVisibleSettingsPanel', isVisibleSettingsPanel.get());
        const position = savedPosition.get();
        const isLeft = position.includes('left');
        if (isLeft) {
            this.style.left = isEdgeControlsCollapsed.get() ? '-100px' : '0';
            this.style.right = 'auto';
        } else {
            this.style.right = isEdgeControlsCollapsed.get() ? '-100px' : '0';
            this.style.left = 'auto';
        }
        this.style.display = hiddenEdgeControls.get() ? 'none' : 'block';
        return html`
            <div id="html-injector-drag-handle" @mousedown=${this.handleDragStart} @touchstart=${this.handleDragStart}>
                <div class="drag-dots">
                ${Array.from({ length: 3 }).map(() => html`
                    <div style="display: flex; flex-direction: column; justify-content: space-between; height: 15px;">
                        ${Array.from({ length: 2 }).map(() => html`
                            <div style="width: 4px; height: 4px; border-radius: 50%; background-color: var(--smart-theme-body-color);"></div>
                        `)}
                    </div>
                `)}
                </div>
            </div>
            <label class="html-injector-switch">
                <input type="checkbox" id="edge-injection-toggle" @change=${this.handleToggleChange} .checked=${isInjectionEnabled.get()}>
                <span class="html-injector-slider"></span>
            </label>
            <button id="html-injector-toggle-panel" class="html-injector-button menu_button" @click=${this.toggleSettingsPanel}>${isVisibleSettingsPanel.get() ? "Show Panel" : "Hide Panel"}</button>
            <button id="toggle-edge-controls" style=${styleMap(this.toggleEdgeButtonStyle)}
            @click=${this.handleToggleEdgeControls}
            >
            ${isEdgeControlsCollapsed.get() ? '<<' : '>>'}
            </button>
`
    }
    handleDragStart(e: DragEvent | MouseEvent | TouchEvent) {
        this.isDragging = true;
        this.startY = e.type.includes('mouse') ? (e as MouseEvent).clientY : (e as unknown as TouchEvent).touches[0].clientY;
        this.startTop = this.getBoundingClientRect().top;
        e.preventDefault();
    }
    handleDragMove(event: DragEvent | MouseEvent | TouchEvent) {
        if (!this.isDragging) {
            return;
        }
        const clientY = event.type.includes('mouse') ? (event as MouseEvent).clientY : (event as unknown as TouchEvent).touches[0].clientY;
        let newTop = this.startTop + (clientY - this.startY);
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - this.offsetHeight));
        this.newTop = newTop;
        this.style.top = `${newTop}px`;

    }
    handleDragEnd(event: DragEvent) {
        this.isDragging = false;
        if (activationMode.get() === 'custom') {
            saveTopPosition.set(this.newTop.toString());
        }
    }



    handleToggleEdgeControls(event: Event) {
        isEdgeControlsCollapsed.set(!isEdgeControlsCollapsed.get());
        const value = isEdgeControlsCollapsed.get();
        const position = savedPosition.get();
        const isLeft = position.includes('left');
        // Update toggle button text and panel position
        const toggleButton = event.target as HTMLElement;
        if (isLeft) {
            this.style.left = value ? '-100px' : '0';
            this.style.right = 'auto';
            toggleButton.textContent = value ? '>>' : '<<';
        } else {
            this.style.right = value ? '-100px' : '0';
            this.style.left = 'auto';
            toggleButton.textContent = value ? '<<' : '>>';
        }
        // Update button style
        this.toggleEdgeButtonStyle = {
            ...this.toggleEdgeButtonStyle,
            ...(isLeft ? {
                right: '-20px',
                left: 'auto',
                borderRadius: '0 5px 5px 0'
            } : {
                left: '-20px',
                right: 'auto',
                borderRadius: '5px 0 0 5px'
            })
        };
    }
    handleToggleChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const isEnabled = target.checked;
        console.log('isEnabled', isEnabled);
        isInjectionEnabled.set(isEnabled);
        if (isEnabled) {
            injectHtmlCode();
        } else {
            removeInjectedIframes();
        }

    }
    toggleSettingsPanel(event: Event) {
        this.settingsPanel.toggleSettingsPanel(event);
    }
    updatePosition() {
        this.updateEdgeControlsPosition(savedPosition.get());
    }
    updateEdgeControlsPosition(position: string) {
        // Determine if it's on the left or right
        const isLeft = position.includes('left');
        // Update the panel's style class
        if (isLeft) {
            this.classList.add('left-side');
        } else {
            this.classList.remove('left-side');
        }
        // Set vertical position
        switch (position) {
            case 'top-right':
            case 'top-left':
                this.style.top = '20vh';
                this.style.transform = 'none';
                break;
            case 'right-three-quarters':
            case 'left-three-quarters':
                this.style.top = '75vh';
                this.style.transform = 'none';
                break;
            case 'right-middle':
            case 'left-middle':
                this.style.top = '50%';
                this.style.transform = 'translateY(-50%)';
                break;
            case 'custom':
                this.style.top = saveTopPosition.get() ? `${saveTopPosition.get()}px` : "20vh";
                this.style.transform = 'none';
                break;

        }
        // Set horizontal position
        if (isLeft) {
            this.style.left = isEdgeControlsCollapsed.get() ? '-100px' : '0';
            this.style.right = 'auto';
        } else {
            this.style.right = isEdgeControlsCollapsed.get() ? '-100px' : '0';
            this.style.left = 'auto';
        }
        // Update toggle button style
        this.toggleEdgeButtonStyle = {
            ...this.toggleEdgeButtonStyle,
            ...(isLeft ? {
                right: '-20px',
                left: 'auto',
                borderRadius: '0 5px 5px 0'
            } : {
                left: '-20px',
                right: 'auto',
                borderRadius: '5px 0 0 5px'
            })
        };
        this.requestUpdate(); // Request update to apply new styles
    }
}


customElements.define('settings-panel', SettingsPanel);
customElements.define('edge-controls', EdgeControls);
export function initInjector() {
    const settingsPanel = document.createElement('settings-panel') as SettingsPanel;
    const edgeControls = document.createElement('edge-controls') as EdgeControls;
    settingsPanel.id = 'html-injector-settings';
    edgeControls.id = 'html-injector-edge-controls';
    settingsPanel.edgeControls = edgeControls;
    edgeControls.settingsPanel = settingsPanel;
    const position = savedPosition.get();
    if (position.includes('left')) {
        edgeControls.classList.add('left-side');
    }
    document.body.appendChild(settingsPanel);
    document.body.appendChild(edgeControls);
    // Ensure initial position and styles are correct
    edgeControls.updateEdgeControlsPosition(position);
    window.addEventListener("resize", () => {
        edgeControls.updatePosition();
    })
    window.addEventListener('message', handleMessage);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateAllIframesTheme);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}
