## Introduction

`ZerxzLib` is an extension plugin for SillyTavern designed to enhance the Gemini API experience. It provides multiple API key rotation, automatic fetching of new models, and more detailed error explanation features, helping users use Gemini API more efficiently and stably.

## Main Features

1.  **Multiple API Key Rotation:**
    *   Allows users to configure multiple Gemini API Keys and automatically rotate them.
    *   When one key has a problem, it automatically switches to the next available key to improve stability.
    *   Supports entering multiple API Keys in a textbox, separated by new lines or semicolons.
    *   The interface displays the currently used key and the previously used key.

2.  **Automatic Fetching of New Models:**
    *   Automatically detects newly released Gemini API models.
    *   Adds new models to the SillyTavern model selection list.
    *   Updates configuration only when the model list changes to avoid redundant updates.
    *   **Note:** On the first load of the plugin, all Gemini models are added to the list.

3.  **Detailed Error Explanation:**
    *   When the Gemini API returns an error, more detailed error information is displayed, including common causes and possible solutions.
    *   Provides common error codes and explanations to help users quickly identify issues.
    *   Users can choose whether to enable this feature to show detailed error information only when needed.
    *   Error information is displayed in a popup with a detailed reason and solution table.

4.  **Key Rotation Switch:**
    *   Users can toggle the key rotation feature.
    *   When off, the plugin will not rotate keys automatically.

5.  **Error Explanation Switch:**
    *   Users can enable or disable detailed error explanations.

## Usage

1.  **Installation (Method 1):**
    *   Copy the plugin code to the `public/scripts/extensions/third-party` directory in SillyTavern.
    *   Make sure the `js` field in `manifest.json` points to the correct `zerxzLib.js` file path.

2.  **Installation (Method 2):**
    *   On the SillyTavern extensions page, click the "Install Extension" button.
    *   Enter the repository address (e.g., `https://github.com/ZerxZ/SillyTavern-Extension-ZerxzLib`) in the popup window to install.

3.  **Configuration:**
    *   On the SillyTavern API settings page (usually Google AI Studio/MakerSuite), you’ll see the following enhancements:
        *   A textbox for entering multiple Gemini API Keys, one per line or separated by semicolons.
        *   Display of the current and previous key.
        *   "Fetch New Models" button for manual updates.
        *   "Save Key" button for saving API Key configurations.
        *   "Key Rotation Settings" button for toggling key rotation.
        *   "View Error Explanations" button for showing common Gemini API errors.
        *   "Error Explanation Switch" button for toggling error explanation.

4.  **Multiple API Keys:**
    *   Enter your Gemini API Keys (one per line or semicolon separated) in the textbox.
    *   The plugin will rotate keys when the current key is unavailable.

5.  **Automatic Model Fetching:**
    *   The plugin will automatically detect new Gemini API models and add them to the model selection list.
    *   You can also manually trigger updates with the "Fetch New Models" button.

6.  **Error Explanation:**
    *   When the Gemini API returns an error and this feature is enabled, a popup will show the error details and solutions.

7.  **Key Rotation Switch:**
    *   Toggle the "Key Rotation Settings" button to enable or disable automatic key rotation.

8.  **Error Explanation Switch:**
    *   Toggle the "Error Explanation Switch" button to enable or disable detailed error explanations.

## Notes

*   Make sure your API Keys are valid.
*   If the plugin does not work, check the console for error messages.
*   **On first load, all Gemini models will be added to the list.**
*   If you receive an `Internal Server Error`, mobile users should use clash and not third-party proxy apps; PC users should enable service mode and tun mode. If the error persists, delete the reverse proxy address.

## File Structure

```
├── lib/
│   └── copyFile.js  # Used to copy built files to the SillyTavern directory
├── src/
│   ├── utils/
│   │   ├── gemini.ts # Gemini API logic
│   │   └── index.ts # utils export
│   ├── global.d.ts # Global type definitions
│   └── index.ts # Plugin entry
├── .babelrc # Babel config
├── .gitignore # Git ignore file
├── LICENSE # Open source license
├── README.md # This documentation
├── bun.lockb # Bun package lock file
├── manifest.json # SillyTavern plugin manifest
├── package.json # npm package config
├── tsconfig.json # TypeScript config
└── webpack.config.mjs # Webpack config
```

## License

This project uses the GNU Affero General Public License v3. See the `LICENSE` file for details.

## Contact

If you have any questions or suggestions, please open an issue on GitHub or contact the author.
