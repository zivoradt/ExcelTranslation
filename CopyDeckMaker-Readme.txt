Translation Extraction Script

This script extracts text content from an HTML file and saves it to an Excel file for translation. It utilizes Cheerio for HTML parsing and XLSX for Excel file handling.

Features:

Automatically detects and loads an HTML file from the specified directory.
Extracts text content and relevant attributes (alt, title, placeholder) from the HTML file.
Saves the extracted text to an Excel file for translation.
Usage:

Place your HTML file in the Uploads directory.
Run the script.
The extracted text will be saved in an Excel file named extracted_translations.xlsx in the ExtractedTranslation directory.
Instructions:

Ensure you have Node.js installed on your system.
Install the required dependencies by running npm install in the terminal.
Place your HTML file in the Uploads directory.

    -- Run the script by executing node "copydeckMaker.js" in the terminal.

Once the script completes execution, find the translated text in an Excel file in the ExtractedTranslation directory.

--------------------------------------------------------------------------------------------------