HTML Translation Script

This script translates text content within an HTML file based on translations provided in an Excel file. It utilizes Cheerio for HTML parsing and XLSX for Excel file handling.

Features:

Automatically detects and loads HTML and Excel files from the specified directory.
Translates text content within the HTML file using translations provided in the Excel file.
Removes unnecessary HTML tags (<html>, <head>, <body>) before saving the translated HTML.
Usage:

Place your HTML file and Excel file in the Uploads directory.
Run the script.
The translated HTML file will be saved in the Uploads directory with the name html_translated.html.
Instructions:

Ensure you have Node.js installed on your system.
Install the required dependencies by running npm install in the terminal.
Place your HTML file and Excel file in the Uploads directory.

        -- Run the script by executing node "translate.js" in the terminal.

Once the script completes execution, find the translated HTML file in the Uploads directory.

--------------------------------------------------------------------------------------------------
