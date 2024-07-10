document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('extractButton').addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: extractContent
            }, function (results) {
                const content = results[0].result;
                const formData = new FormData();
                formData.append('htmlFile', new Blob([content], { type: 'text/html' }), 'content.html');

                fetch('http://localhost:3000/upload/copydeck', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.blob(); // assuming the server sends the file as blob
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'english_copydeck.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.getElementById('result').innerHTML = `
                        <div class="alert alert-success" role="alert">
                            Copydeck creation complete.
                        </div>
                    `;
                })
                .catch(err => {
                    console.error('Error creating copydeck:', err);
                    document.getElementById('result').innerHTML = '<div class="alert alert-danger" role="alert">Error creating copydeck</div>';
                });
            });
        });
    });

    function extractContent() {
        const contentDiv = document.querySelector('div#content[role="main"]');
        return contentDiv ? contentDiv.outerHTML : '<div id="content" role="main">Content not found</div>';
    }
});
