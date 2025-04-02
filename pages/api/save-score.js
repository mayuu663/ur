// pages/api/save-score.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wkfwfirhoteijgcdsjom.supabase.co',
  'your-anon-key-here'
);

export default async function handler(req, res) {
  console.log('Request method:', req.method);  // リクエストメソッド確認
  console.log('Request body:', req.body);  // 受け取ったデータ確認

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, score } = req.body;

  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { data, error } = await supabase
    .from('scores')
    .insert([{ username, score, timestamp: new Date().toISOString() }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  console.log('Data inserted:', data);  // 挿入されたデータ確認
  return res.status(200).json({ success: true, data });
}
