export default async function handler(req, res) {
  if (req.method === 'POST') {
    const fid = req.body?.untrustedData?.fid;
    const username = req.body?.untrustedData?.username;

    res.setHeader('Set-Cookie', `fid=${fid}; Path=/`);
    res.status(200).json({ ok: true });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
