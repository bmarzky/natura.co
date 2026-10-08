const express = require('express');
const path = require('path');
const chatRoutes = require('./routes/chatRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();
app.use(express.json());

// Mengarahkan ke folder public di direktori root
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/chat', chatRoutes);
app.use('/api/webhook', webhookRoutes);

// Fix untuk cPanel yang kadang tidak memotong awalan /bot/
app.use('/bot/api/chat', chatRoutes);
app.use('/bot/api/webhook', webhookRoutes);

module.exports = app;
