function sendText(response, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'content-type': contentType,
    'content-length': Buffer.byteLength(text),
  });
  response.end(text);
}

function sendJson(response, statusCode, payload) {
  sendText(response, statusCode, JSON.stringify(payload, null, 2), 'application/json; charset=utf-8');
}

function sendHtml(response, statusCode, html) {
  sendText(response, statusCode, html, 'text/html; charset=utf-8');
}

module.exports = { sendText, sendJson, sendHtml };
