// pages/api/get-scores.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wkfwfirhoteijgcdsjom.supabase.co',
  'your-anon-key-here'
);

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('scores')  // 'scores'テーブルからデータを取得
    .select('*')  // 全データを選択
    .order('score', { ascending: false })  // スコアで降順に並べる
    .limit(10);  // 上位10件を取得

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);  // 取得したデータを返す
}
