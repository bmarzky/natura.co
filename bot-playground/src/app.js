const express = require('express');
const path = require('path');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
app.use(express.json());

// Mengarahkan ke folder public di direktori root
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/chat', chatRoutes);

module.exports = app;
