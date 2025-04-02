// pages/api/frame.js

export default function handler(req, res) {
  if (req.method === 'POST') {
    const fid = req.body?.untrustedData?.fid || 0;
    const username = req.body?.untrustedData?.username || 'anon';

    res.setHeader('Set-Cookie', [
      `fid=${fid}; Path=/; HttpOnly; SameSite=Lax`,
      `username=${encodeURIComponent(username)}; Path=/; HttpOnly; SameSite=Lax`
    ]);

    return res.status(200).json({ fid, username });
  }

  res.status(405).end();
}
