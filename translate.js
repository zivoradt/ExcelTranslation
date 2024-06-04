const fs = require('fs');
const cheerio = require('cheerio');
const xlsx = require('xlsx');
const path = require('path');

// Function to ensure a directory exists
function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Function to find a file in a directory
function fromDir(startPath, filter) {
    if (!fs.existsSync(startPath)) {
        console.log("No directory", startPath);
        return null;
    }

    const files = fs.readdirSync(startPath);
    for (const file of files) {
        const filename = path.join(startPath, file);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            const result = fromDir(filename, filter); // Recurse
            if (result) {
                return result;
            }
        } else if (filename.endsWith(filter)) {
            console.log('-- Found:', filename);
            return filename;
        }
    }
    return null;
}

// Define the directories
const uploadDir = path.join(__dirname, 'Uploads');
const outputDir = path.join(__dirname, 'Uploads');

// Ensure the output directory exists
ensureDirSync(outputDir);

// Find the Excel and HTML files in the upload directory
const excelPath = fromDir(uploadDir, '.xlsx');
const htmlPath = fromDir(uploadDir, '.html');

if (!excelPath || !htmlPath) {
    console.error("Could not find the required files in the 'Uploads' directory.");
    process.exit(1);
}

// Load the translation Excel file
const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const translations = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// Load the HTML file
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(html);

// Create a translation map
const translationMap = {};
translations.forEach(row => {
    const original = row[0]?.trim().replace(/\s+/g, ' ');
    const translation = row[1]?.trim().replace(/\s+/g, ' ');
    if (original && translation) {
        translationMap[original] = translation;
    }
});

// Function to translate text
function translateText(text) {
    const normalizedText = text.trim().replace(/\s+/g, ' ');
    return translationMap[normalizedText] || text;
}

// Function to normalize text by removing extra whitespace
function normalizeText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

// Recursive function to translate all text nodes
function translateElement(element) {
    element.contents().each((i, elem) => {
        const child = $(elem);

       
        if (elem.nodeType === 3) { 
            const text = normalizeText(child.text());
            if (text) {
                const translatedText = translateText(text);
                child.replaceWith(translatedText);
            }
        } else if (elem.nodeType === 1) { 
            
            translateElement(child);

            const attributes = ['alt', 'title', 'placeholder'];
            attributes.forEach(attr => {
                const attrValue = child.attr(attr);
                if (attrValue) {
                    const translatedAttrValue = translateText(normalizeText(attrValue));
                    child.attr(attr, translatedAttrValue);
                }
            });
        }
    });
}

// Start translation from the body element
translateElement($('html'));


let translatedHtml = $.html();
translatedHtml = translatedHtml.replace(/<\/?(html|head|body)[^>]*>/g, ''); 

// Save the translated HTML file
const outputPath = path.join(outputDir, 'html_translated.html');
fs.writeFileSync(outputPath, translatedHtml, 'utf8');
console.log(`Translation complete. Translated file saved as ${outputPath}`);
