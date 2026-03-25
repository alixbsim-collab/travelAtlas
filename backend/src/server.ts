import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import aiRouter from './routes/ai';
import atlasRouter from './routes/atlas';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client for legacy endpoints
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Travel Atlas API is running' });
});

// Legacy destinations endpoint
app.get('/api/destinations', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('destinations').select('*');
    if (error) throw error;
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mount route modules
app.use('/api/ai', aiRouter);
app.use('/api/atlas', atlasRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Travel Atlas API running on port ${PORT}`);
});

export default app;
