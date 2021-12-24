const express = require('express')
const path = require('path')
const fetch = require('node-fetch')
const PORT = process.env.PORT || 5000
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const username = 'NVIDIA_Saturn_V';

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM stats;');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/update', async (req, res) => {
    try {
      const client = await pool.connect();
      const countFetch = await fetch('https://api.foldingathome.org/user-count');
      const count = await countFetch.text();
      const response = await fetch(`https://api.foldingathome.org/user/${username}`);
      const userInfo = await response.json();
      let d = new Date();
      let currentDate = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      // TODO handle error
      pool.query(`INSERT INTO stats(date,id,name,score,wus,rank)VALUES($1,$2,$3,$4,$5,$6)`, [currentDate, userInfo['id'],userInfo['name'],userInfo['score'],userInfo['wus'],`${userInfo['rank']} out of ${count}`], (err, res) => {});
      res.send('Done!')
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
