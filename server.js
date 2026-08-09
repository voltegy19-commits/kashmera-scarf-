const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadOrders() {
  ensureDataDir();
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
  }
  const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse orders.json:', err);
    return [];
  }
}

function saveOrders(orders) {
  ensureDataDir();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

app.post('/api/orders', (req, res) => {
  const order = req.body;
  if (!order || !order.id || !order.customer || !Array.isArray(order.items)) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }

  order.createdAt = new Date().toISOString();
  order.status = 'new';

  const orders = loadOrders();
  orders.push(order);
  saveOrders(orders);

  return res.status(201).json({ message: 'Order saved', orderId: order.id });
});

app.get('/api/orders', (req, res) => {
  const orders = loadOrders();
  res.json(orders);
});

app.delete('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  if (!orderId) {
    return res.status(400).json({ error: 'Order id is required' });
  }
  const orders = loadOrders();
  const filtered = orders.filter(order => order.id !== orderId);
  if (filtered.length === orders.length) {
    return res.status(404).json({ error: 'Order not found' });
  }
  saveOrders(filtered);
  return res.json({ message: 'Order deleted', orderId });
});

app.listen(PORT, () => {
  console.log(`Kashmera backend running at http://localhost:${PORT}`);
  console.log('Serving static files and /api/orders endpoint');
});
