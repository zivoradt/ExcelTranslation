
---

# Translator and Copydeck Maker for AEM Components

This project provides tools for translating AEM components and creating copydecks from HTML content. It includes a Node.js Express server for backend processing and a browser extension for sending HTML content to the backend for translation or copydeck creation. The project also supports extracting translations from Excel files and applying them to HTML code.

## Table of Contents
- [Project Overview](#project-overview)
- [Setup](#setup)
  - [Backend](#backend)
  - [Browser Extension](#browser-extension)
- [Usage](#usage)
  - [Sending HTML to Backend](#sending-html-to-backend)
  - [Creating a Copydeck](#creating-a-copydeck)
  - [Translating a Page](#translating-a-page)
- [License](#license)

## Project Overview

The "Translator and Copydeck Maker for AEM components" project is designed to facilitate the translation of AEM components and the creation of copydecks. The project consists of two main parts:
- **Backend**: A Node.js Express server located in the `app` folder.
- **Browser Extension**: A browser extension located in the `extension` folder for sending HTML content to the backend server.

## Setup

### Backend

1. **Navigate to the `app` folder**:
    ```sh
    cd app
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Run the server**:
    ```sh
    npm start
    ```

   The server will start on the specified port (default is 3000).

### Browser Extension

1. **Navigate to the `extension` folder**:
    ```sh
    cd extension
    ```

2. **Load the extension in your browser**:
   - Open your browser's extensions page (e.g., `chrome://extensions/` in Chrome).
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `extension` folder.

## Usage

### Sending HTML to Backend

The browser extension allows you to send HTML content to the backend server for translation or copydeck creation.

1. **Select the HTML content** you want to send.
2. **Right-click** and choose the appropriate option from the context menu (e.g., "Send to Backend for Copydeck").

### Creating a Copydeck

The backend server processes the HTML content and generates a copydeck.

1. **Send HTML content** to the backend using the browser extension.
2. **Access the generated copydeck** from the backend server's response.

### Translating a Page

The backend server can extract translations from an Excel file and apply them to the HTML content.

1. **Upload the Excel file** containing translations to the backend server.
2. **Send HTML content** to the backend using the browser extension.
3. **Receive the translated HTML** from the backend server's response.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to modify this README to suit your project's specific needs and details.
