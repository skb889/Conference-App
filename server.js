const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Connect to the SQLite database
const db = new sqlite3.Database('travel_application.db');

// Set up middleware to parse form data and file uploads
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/a.html');
});

// Configure EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Create a 'views' directory in your project folder

// ...

// Define a route to display data
app.get('/display', (req, res) => {
  // Fetch data from the database (adjust your SQL query as needed)
  db.all('SELECT * FROM applications', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error while fetching data from the database.');
    } else {
      // Render the display.ejs page and pass the data to it
      res.render('display', { data: rows });
    }
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Serve static files (e.g., CSS and uploaded files)
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Define a route for submitting the form
app.post('/submit', upload.single('sop'), (req, res) => {
  const { name, reason, department, recommendation } = req.body;
  const sop = req.file ? req.file.filename : '';

  db.run('ALTER TABLE applications ADD COLUMN recommendation TEXT', (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Successfully added the "recommendation" column to the table.');
    }
  });
  

  db.run(
    'INSERT INTO applications (name, reason, department, sop, recommendation) VALUES (?, ?, ?, ?, ?)',
    [name, reason, department, sop, recommendation],
    (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error while saving data to the database.');
      } else {
        res.send('Application submitted successfully!');
      }
    }
  );
});


// Recommendation Form and Handling
// Display the recommendation form
app.get('/recommend', (req, res) => {
  // Fetch data from the database to display a list of applications that need recommendations
  db.all('SELECT * FROM applications WHERE recommendation IS NULL', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error while fetching data from the database.');
    } else {
      // Render the 'recommend.ejs' page and pass the data to it
      res.render('recommend', { applications: rows });
    }
  });
});

// Handle the submission of recommendations
app.post('/submitRecommendation', (req, res) => {
  const { applicationId, recommendation } = req.body;

  // Update the application in the database with the recommendation
  db.run('UPDATE applications SET recommendation = ? WHERE id = ?', [recommendation, applicationId], (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error while updating the database.');
    } else {
      res.redirect('/recommend');
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
