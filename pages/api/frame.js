export default function handler(req, res) {
  if (req.method === 'POST') {
    const fid = req.body?.untrustedData?.fid || 0;
    const username = req.body?.untrustedData?.username || 'anon';

    res.setHeader('Set-Cookie', [
      `fid=${fid}; Path=/; SameSite=Lax`,
      `username=${encodeURIComponent(username)}; Path=/; SameSite=Lax`
    ]);

    return res.status(200).json({ fid, username });
  }

  res.status(405).end();
}
