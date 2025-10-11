const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home_page.html'));
});

app.get('/manual', (req, res) => {
  res.sendFile(path.join(__dirname, 'manual_planner.html'));
});

app.get('/smart', (req, res) => {
  res.sendFile(path.join(__dirname, 'smart_planner.html'));
});

app.post('/api/save-plan', (req, res) => {
  const plan = req.body;
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});