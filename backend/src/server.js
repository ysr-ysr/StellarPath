require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`StellarPath API running at http://localhost:${PORT}`);
  await testConnection();
});
