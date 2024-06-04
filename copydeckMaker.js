const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const xlsx = require('xlsx');

// Function to ensure a directory exists
function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Function to normalize text by removing extra whitespace
function normalizeText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

// Function to extract text nodes from HTML
function extractText(element, extractedTexts) {
    element.contents().each((i, elem) => {
        const child = $(elem); // Wrap with Cheerio

        // If the node is a text node, extract it
        if (elem.nodeType === 3) { // Node.TEXT_NODE
            const text = normalizeText(child.text());
            if (text) {
                extractedTexts.push([text]);
            }
        } else if (elem.nodeType === 1) { // Node.ELEMENT_NODE
            // Recursively extract text from child elements
            extractText(child, extractedTexts);

            const attributes = ['alt', 'title', 'placeholder'];
            attributes.forEach(attr => {
                const attrValue = child.attr(attr);
                if (attrValue) {
                    const normalizedAttrValue = normalizeText(attrValue);
                    extractedTexts.push([normalizedAttrValue]);
                }
            });
        }
    });
}

// Define the input and output directories
const inputDir = path.join(__dirname, 'Uploads');
const outputDir = path.join(__dirname, 'ExtractedTranslation');

// Ensure the input and output directories exist
ensureDirSync(inputDir);
ensureDirSync(outputDir);

// Define the HTML file path
const htmlFileName = 'index.html'; // Update with your actual HTML file name
const htmlPath = path.join(inputDir, htmlFileName);

// Check if the HTML file exists
if (!fs.existsSync(htmlPath)) {
    console.error(`HTML file not found at ${htmlPath}`);
    process.exit(1);
}

// Load the HTML file
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(html);

// Extract text nodes
const extractedTexts = [];
extractText($('html'), extractedTexts);

// Create a new workbook and worksheet
const newWorkbook = xlsx.utils.book_new();
const newWorksheet = xlsx.utils.aoa_to_sheet(extractedTexts);
xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Translations');

// Write the Excel file to the specified directory
const outputPath = path.join(outputDir, 'extracted_translations.xlsx');
xlsx.writeFile(newWorkbook, outputPath);

console.log(`Translation extraction complete. File saved to ${outputPath}`);
