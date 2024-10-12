let express = require('express');
let path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const { DATABASE_URL } = process.env;

let app = express()
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT version()');
    console.log(res.rows[0]);
  } finally {
    client.release();
  }
}

getPostgresVersion();

app.post('/posts', async (req, res) => {
  const client = await pool.connect();
  try {
    const data = {
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      created_at: new Date().toISOString()
    };

    const query = 'INSERT INTO posts (title, content, author, created_at) VALUES ($1, $2, $3, $4) RETURNING id';
    const params = [data.title, data.content, data.author, data.created_at];

    const result = await client.query(query, params);
    data.id = result.rows[0].id; // assign the last inserted id to data object

    console.log(`Post created successfully with id ${data.id}`);
    res.json({ "status": "success", "data": data, "message": "Post created successfully" });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ "error": error.message });
  } finally {
    client.release();
  }
})

app.delete('/posts/:id', async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();

  try {
    const deleteQuery = 'DELETE FROM posts WHERE id = $1';
    await client.query(deleteQuery, [id]);

    res.json({ "status": "success", "message": "Post deleted successfully" });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ "error": error.message });
  } finally {
    client.release();
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
  // res.sendFile(path.join('/home/runner/restful-api-demo' + '/index.html'));
  // res.sendFile('/home/runner/restful-api-demo/index.html'));
});

// Catch 404 and forward to error handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname + '/404.html'));
});

app.listen(3000, () => {
  console.log('App is listening on port 3000');
});