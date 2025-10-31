// Minimal test function to verify Vercel deployment
module.exports = (req, res) => {
  res.json({
    message: 'Hello from Vercel serverless function!',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  });
};

