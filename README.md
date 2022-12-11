# What is AC Event Bucket?

It is a Chrome extension that allows Liferay Analytics Cloud developers to view real-time events sent by the applications and websites monitored on the platform in the browser console. This extension is useful for quickly and efficiently analyzing data and making real-time data-driven decisions.

### Read the installation guide

[Installation guide](README-installation-guide.md)

### More about this extension

The `manifest.json` file included in this repository defines the properties and behaviors of the extension. It includes metadata such as the extension name, version, and icons, as well as the permissions required by the extension and the scripts that it uses. The `content_scripts` section specifies that the `content-script.js` script should be injected into all pages visited by the user, while the `background` section specifies that the `background.js` script should be run in the background. Finally, the `browser_action` section specifies that the extension should have a button in the browser toolbar with the default title "AC Event Bucket" and that clicking the button should open the `popup.html` page.

To use this extension, download and unzip the files in this repository, and follow the [instructions on the Chrome Developer website](https://developer.chrome.com/extensions/getstarted#manifest) to load the extension in your browser. After the extension is installed, it will automatically start collecting and displaying real-time events from the Liferay Analytics Cloud platform in the browser console. You can access the events by opening the browser console (usually by pressing F12 or Ctrl+Shift+I) and selecting the "AC Event Bucket" tab. You can filter the events by type, date and time, and user to perform more detailed analysis.

We hope that this extension will help Liferay Analytics Cloud developers to quickly and easily analyze real-time data and make informed decisions based on that data. If you have any questions or feedback, please feel free to open an issue on this repository.
