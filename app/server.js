// Minimal app under test. Serves a page that renders a product list
// with client-side JavaScript after a small delay, so every test has
// to wait for real rendering instead of parsing static HTML.
const http = require('http');

const PORT = process.env.PORT || 4173;

const page = (id) => `<!doctype html>
<html>
<head><title>Catalog ${id}</title></head>
<body>
  <h1>Catalog ${id}</h1>
  <div id="status">loading</div>
  <ul id="items"></ul>
  <script>
    setTimeout(() => {
      const ul = document.getElementById('items');
      for (let i = 1; i <= 20; i++) {
        const li = document.createElement('li');
        li.className = 'item';
        li.dataset.price = (i * 3 + ${id}).toFixed(2);
        li.textContent = 'Product ' + i + ' in catalog ${id}';
        ul.appendChild(li);
      }
      document.getElementById('status').textContent = 'ready';
    }, 150);
  </script>
</body>
</html>`;

http
  .createServer((req, res) => {
    const m = req.url.match(/^\/catalog\/(\d+)$/);
    if (!m) {
      res.writeHead(404);
      return res.end('not found');
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(page(m[1]));
  })
  .listen(PORT, () => console.log(`app listening on ${PORT}`));
