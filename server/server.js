const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

// MongoDB Connection
// User provided Atlas Cluster
const mongoURI = 'mongodb+srv://MemoryWall:MemoryWell@cluster0.7dbf95l.mongodb.net/memories_wall?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected to Atlas'))
    .catch(err => console.error(err));

// Schema
const memorySchema = new mongoose.Schema({
    imageUrl: String, // Can be a URL or Base64 string
    description: String, // Optional text description
    createdAt: { type: Date, default: Date.now }
});

const Memory = mongoose.model('Memory', memorySchema);

// Routes

// Get all memories
app.get('/memories', async (req, res) => {
    try {
        const memories = await Memory.find().sort({ createdAt: -1 });
        res.json(memories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload memory
app.post('/upload', async (req, res) => {
    try {
        const { imageUrl, description } = req.body;
        if (!imageUrl && !description) return res.status(400).json({ error: 'No image or text provided' });

        const newMemory = new Memory({ imageUrl, description });
        await newMemory.save();

        res.status(201).json(newMemory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete memory
app.delete('/memories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Memory.findByIdAndDelete(id);
        res.status(200).json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
