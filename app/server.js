const express = require('express');
const multer = require('multer');
const fs = require('fs').promises; // Use promises for async file operations
const cheerio = require('cheerio');

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
 XLSX = require('xlsx-js-style');
const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure a directory exists
async function ensureDirSync(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

// Endpoint to upload files for translation
app.post('/upload', upload.fields([{ name: 'excelFile' }, { name: 'htmlFile' }]), async (req, res) => {
    try {
        const excelFile = req.files['excelFile'][0];
        const htmlFile = req.files['htmlFile'][0];

        if (!excelFile || !htmlFile) {
            return res.status(400).send('Both Excel and HTML files are required.');
        }

        // Generate a unique identifier for this session
        const sessionId = uuidv4();
        const sessionDir = path.join(__dirname, 'uploads', sessionId);
        await ensureDirSync(sessionDir);

        const excelPath = path.join(sessionDir, excelFile.filename);
        const htmlPath = path.join(sessionDir, htmlFile.filename);

        // Move uploaded files to the session directory
        await fs.rename(excelFile.path, excelPath);
        await fs.rename(htmlFile.path, htmlPath);

        // Load the translation Excel file
        const workbook =  XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const translations =  XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Create a translation map
        const translationMap = {};
        translations.forEach(row => {
            const original = row[0]?.trim().replace(/\s+/g, ' ');
            const translation = row[1]?.trim().replace(/\s+/g, ' ');
            if (original && translation) {
                translationMap[original] = translation;
            }
        });

        // Load the HTML file
        const html = await fs.readFile(htmlPath, 'utf8');
        const $ = cheerio.load(html);

        // Dynamically import franc and francAll
        const { franc } = await import('franc');

        // Variables to track translation status
        let translatedCount = 0;
        const untranslatedTexts = [];
        const untranslatedFromExcel = [];
        const translatedFromExcel = [];
        const englishCopydeck = []; // Array to store English words only

        // Function to normalize text
        function normalizeText(text) {
            return text.trim().replace(/\s+/g, ' ');
        }

        // Function to translate text
        function translateText(text) {
            const normalizedText = normalizeText(text);
            const translatedText = translationMap[normalizedText];
            if (translatedText) {
                translatedCount++;
                if (!translatedFromExcel.includes(normalizedText)) {
                    translatedFromExcel.push(normalizedText);
                }
                return translatedText;
            } else {
                if (/^[0-9]+$/.test(normalizedText) || untranslatedTexts.includes(normalizedText)) {
                    return text;
                }
                untranslatedTexts.push(normalizedText);
                return text;
            }
        }

        // Function to check if text is in English
        function isEnglish(text) {
            try {
                return franc(text) === 'eng';
            } catch (error) {
                console.error('Error detecting language:', error);
                return false;
            }
        }

        // Recursive function to translate all text nodes and handle Excel cell length limit
        function translateElement(element) {
            element.contents().each((i, elem) => {
                const child = $(elem);

                if (elem.nodeType === 3) { // Text node
                    const text = normalizeText(child.text());
                    if (text) {
                        if (text.length > 32767) {
                            // Truncate to the first 1000 characters
                            const truncatedText = text.substring(0, 1000);
                            englishCopydeck.push(truncatedText);
                        } else {
                            englishCopydeck.push(text);
                        }
                    }
                } else if (elem.nodeType === 1) { // Element node
                    // Skip <style> and <script> elements
                    if (elem.tagName === 'style' || elem.tagName === 'script') {
                        return;
                    }

                    translateElement(child);

                    const attributes = ['alt', 'title', 'placeholder'];
                    attributes.forEach(attr => {
                        const attrValue = child.attr(attr);
                        if (attrValue) {
                            const normalizedAttrValue = normalizeText(attrValue);
                            if (normalizedAttrValue.length > 32767) {
                                // Truncate to the first 1000 characters
                                const truncatedAttrValue = normalizedAttrValue.substring(0, 1000);
                                englishCopydeck.push(truncatedAttrValue);
                            } else {
                                englishCopydeck.push(normalizedAttrValue);
                            }
                        }
                    });
                }
            });
        }
        // Start translation from the body element
        translateElement($('html'));

        // Strip out html, head, and body tags before saving
        let translatedHtml = $.html();
        translatedHtml = translatedHtml.replace(/<\/?(html|head|body)[^>]*>/g, ''); 

        // Save the translated HTML file
        const translatedHtmlPath = path.join(sessionDir, 'html_translated.html');
        await fs.writeFile(translatedHtmlPath, translatedHtml, 'utf8');

        // Check untranslated keys
        for (const key in translationMap) {
            if (!translatedFromExcel.includes(key)) {
                untranslatedFromExcel.push(key);
            }
        }

        // Determine the output paths for untranslated texts or copydeck texts
        let untranslatedOutputPath = null;
        let englishCopydeckPath = null;
        if (untranslatedFromExcel.length > 0) {
            const untranslatedWorkbook =  XLSX.utils.book_new();
            const untranslatedSheet =  XLSX.utils.aoa_to_sheet(untranslatedFromExcel.map(text => [text]));
             XLSX.utils.book_append_sheet(untranslatedWorkbook, untranslatedSheet, 'Untranslated Texts');
            untranslatedOutputPath = path.join(sessionDir, 'untranslated_text. XLSX');
             XLSX.writeFile(untranslatedWorkbook, untranslatedOutputPath);
        }
        if (englishCopydeck.length > 0) {
            const copydeckWorkbook =  XLSX.utils.book_new();
            const copydeckSheet =  XLSX.utils.aoa_to_sheet(englishCopydeck.map(text => [text]));
             XLSX.utils.book_append_sheet(copydeckWorkbook, copydeckSheet, 'English Copydeck');
            englishCopydeckPath = path.join(sessionDir, 'english_copydeck. XLSX');
             XLSX.writeFile(copydeckWorkbook, englishCopydeckPath);
        }

        res.json({
            message: 'Translation complete',
            translatedHtml: translatedHtml,  // Return the translated HTML text
            untranslated: untranslatedOutputPath ? `/uploads/${sessionId}/${path.basename(untranslatedOutputPath)}` : null,
            untranslatedTexts: englishCopydeckPath ? `/uploads/${sessionId}/${path.basename(englishCopydeckPath)}` : null,
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).send('Internal Server Error');
    }
});

// Endpoint to create English copydeck from HTML file
app.post('/upload/copydeck', upload.single('htmlFile'), async (req, res) => {
    try {
        const htmlFile = req.file;

        if (!htmlFile) {
            return res.status(400).send('HTML file is required.');
        }

        // Generate a unique identifier for this session
        const sessionId = uuidv4();
        const sessionDir = path.join(__dirname, 'uploads', sessionId);
        await ensureDirSync(sessionDir);

        const htmlPath = path.join(sessionDir, htmlFile.filename);

        // Move uploaded file to the session directory
        await fs.rename(htmlFile.path, htmlPath);

        // Load the HTML file
        const html = await fs.readFile(htmlPath, 'utf8');
        const $ = cheerio.load(html);

        // Set to store unique English words only
        const englishCopydeck = new Set();

        // Function to normalize text
        function normalizeText(text) {
            return text.trim().replace(/\s+/g, ' ');
        }

        // Function to check if text matches unwanted patterns
        function isUnwantedPattern(text) {
            const patterns = [
                /^\d+(\.\d+)?x$/, // e.g., 1.4x
                /^\d+%$/, // e.g., 15%
                /^[A-Z0-9]+$/, // e.g., QN87D
                /^\d+\/(\d+\/)*\d+$/, // e.g., 85/75/65 or 98/85/75/65/55/50/43
            ];
            return patterns.some(pattern => pattern.test(text));
        }

        // Function to check if text consists only of standalone punctuation
        function isStandalonePunctuation(text) {
            const punctuationPattern = /^[.,<>;:!?()\[\]{}'"`~@#$%^&*+=|\\/-]+$/;
            return punctuationPattern.test(text);
        }

        // Recursive function to extract all text nodes
        function extractElement(element) {
            element.contents().each((i, elem) => {
                const child = $(elem);

                if (elem.nodeType === 3) { // Text node
                    let text = normalizeText(child.text());
                    if (text && text !== '' && !isUnwantedPattern(text) && !/^\d+$/.test(text) && !isStandalonePunctuation(text)) {
                        if (text.length > 32767) {
                            // Split into chunks to fit into multiple cells
                            const chunks = [];
                            for (let i = 0; i < text.length; i += 32767) {
                                chunks.push(text.substring(i, i + 32767));
                            }
                            text = chunks.join('');
                        }
                        englishCopydeck.add(text);
                    }
                } else if (elem.nodeType === 1) { // Element node
                    // Skip <style> and <script> elements
                    if (elem.tagName === 'style' || elem.tagName === 'script') {
                        return;
                    }

                    extractElement(child);

                    const attributes = ['alt', 'title', 'placeholder'];
                    attributes.forEach(attr => {
                        let attrValue = child.attr(attr);
                        if (attrValue && attrValue !== '' && !isUnwantedPattern(attrValue) && !/^\d+$/.test(attrValue) && !isStandalonePunctuation(attrValue)) {
                            if (attrValue.length > 32767) {
                                // Split into chunks to fit into multiple cells
                                const chunks = [];
                                for (let i = 0; i < attrValue.length; i += 32767) {
                                    chunks.push(attrValue.substring(i, i + 32767));
                                }
                                attrValue = chunks.join('');
                            }
                            englishCopydeck.add(attrValue);
                        }
                    });
                }
            });
        }

        // Start extraction from the body element
        extractElement($('html'));

    
        

        // Create Excel file with English copydeck
        const copydeckWorkbook =  XLSX.utils.book_new();
        const copydeckSheetName = 'English Copydeck';
        const copydeckSheet =  XLSX.utils.aoa_to_sheet(Array.from(englishCopydeck).map(text => [text]));

        

        // Append the sheet to the workbook
         XLSX.utils.book_append_sheet(copydeckWorkbook, copydeckSheet, copydeckSheetName);

           // Apply styles to all cells in the sheet
        const LightBlue = {
            fgColor: { rgb: "BDD7EE" }
        };

        const alignmentCenter = {
            horizontal: "center",
            vertical: "center",
            wrapText: true
        };

        const ThinBorder = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
        };

        // Iterate through all cells in the copydeckSheet
        const range =  XLSX.utils.decode_range(copydeckSheet['!ref']);
        for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
            for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
                const cellAddress =  XLSX.utils.encode_cell({ r: rowNum, c: colNum });
                if (!copydeckSheet[cellAddress]) continue; // Skip if cell is empty

                copydeckSheet[cellAddress].s = {
                    ...LightBlue,
                    ...alignmentCenter,
                    ...ThinBorder
                };
            }
        }

        // Write the workbook to a file
        const copydeckFilePath = path.join(sessionDir, 'english_copydeck. XLSX');
         XLSX.writeFile(copydeckWorkbook, copydeckFilePath);

        // Set headers for file download
        res.set({
            'Content-Disposition': `attachment; filename="english_copydeck. XLSX"`,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Send the file as a response
        res.download(copydeckFilePath, 'english_copydeck. XLSX', (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                return res.status(500).send('Error downloading file');
            } else {
                console.log('File downloaded successfully');
                // Optionally, you can delete the file after download
                fs.unlink(copydeckFilePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting file:', unlinkErr);
                    } else {
                        console.log('File deleted successfully');
                    }
                });
            }
        });

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).send('Internal Server Error');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
