const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const moment = require('moment');

const app = express();
app.use(express.json());

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/url_shortener', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

// Modelo de URL
const urlSchema = new mongoose.Schema({
    original_url: { type: String, required: true },
    short_url: { type: String, required: true, unique: true },
    created_at: { type: Date, default: Date.now }
});
const URL = mongoose.model('URL', urlSchema);

// Endpoint para encurtar uma URL
app.post('/shorten', async (req, res) => {
    const { original_url } = req.body;

    if (!original_url) {
        return res.status(400).json({ error: 'URL original é obrigatória' });
    }

    try {
        // Verificar se a URL já foi encurtada
        let existingUrl = await URL.findOne({ original_url });
        if (existingUrl) {
            return res.json({ short_url: existingUrl.short_url });
        }

        // Gerar identificador único
        const short_url = shortid.generate();

        // Persistir no banco de dados
        const newUrl = new URL({ original_url, short_url });
        await newUrl.save();

        res.json({ original_url, short_url });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao encurtar a URL' });
    }
});

// Endpoint para obter a URL longa com base no ID
app.get('/url/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const url = await URL.findById(id);
        if (!url) {
            return res.status(404).json({ error: 'URL não encontrada' });
        }
        res.json({ original_url: url.original_url, short_url: url.short_url });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar a URL' });
    }
});

// Endpoint para obter todas as URLs criadas em uma data específica
app.get('/urls', async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Data é obrigatória no formato YYYY-MM-DD' });
    }

    try {
        const startOfDay = moment(date).startOf('day').toDate();
        const endOfDay = moment(date).endOf('day').toDate();

        const urls = await URL.find({
            created_at: { $gte: startOfDay, $lte: endOfDay }
        });

        res.json({ urls });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar URLs' });
    }
});

// Endpoint para expandir uma URL encurtada
app.get('/expand/:short_url', async (req, res) => {
    const { short_url } = req.params;

    try {
        const url = await URL.findOne({ short_url });
        if (!url) {
            return res.status(404).json({ error: 'URL não encontrada' });
        }
        res.json({ original_url: url.original_url });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar a URL' });
    }
});

// Iniciar o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
