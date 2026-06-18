export default function handler(req: any, res: any) {
  res.json({ ok: true, ts: Date.now(), node: process.version });
}
