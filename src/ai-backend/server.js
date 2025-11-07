import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, mood } = req.body;

    const systemPreamble = [
      { role: 'system', content: 'You are a concise, supportive companion.' },
      mood ? { role: 'system', content: `User mood: ${mood}. Be validating and practical.` } : null,
    ].filter(Boolean);

    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [...systemPreamble, ...messages],
    });

    res.json({
      reply: response.output_text || "I’m here with you. Let’s take a slow breath together.",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(process.env.PORT || 8787, () =>
  console.log(`✅ Server running on port ${process.env.PORT || 8787}`)
);
