const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const moment = require('moment');
const archiver = require('archiver');  // Add archiver package

// Create an Express app
const app = express();

// Set the port for the server
const port = 3000;

// Create the uploads folder if it doesn't exist
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Initialize Multer
const upload = multer({ storage: storage });

// Serve static files (images) from the 'uploads' folder
app.use('/uploads', express.static('uploads'));

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Array to store uploaded file data
const uploadedFiles = [];

// Home route to display the form and uploaded images
app.get('/', (req, res) => {
  const filterDate = req.query.date;
  const filterSubject = req.query.subject;

  // Filter files based on the selected date and subject
  const filteredFiles = uploadedFiles.filter(file => {
    return (
      (!filterDate || file.date === filterDate) &&
      (!filterSubject || file.subject === filterSubject)
    );
  });

  // Generate HTML for the upload form and images
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Homework Upload Feed</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1, h2 {
          text-align: center;
        }
        form {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
        }
        input, select, textarea, button {
          width: 100%;
          height: 40px;
          padding: 8px;
          margin-bottom: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 16px;
          box-sizing: border-box;
        }

        textarea {
          height: auto;
          resize: vertical;
          min-height: 80px;
        }

        button {
          height: auto;
          background-color: #007bff;
          color: #fff;
          border: none;
          cursor: pointer;
        }

        button:hover {
          background-color: #0056b3;
        }

        .homework-feed {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }
        .homework-post {
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .homework-post img {
          width: 100%;
          height: auto;
        }
        .homework-details {
          padding: 10px;
        }
        .homework-details h3 {
          margin: 10px 0;
        }
        .homework-details p {
          margin: 5px 0;
        }
        .download-buttons {
          margin-top: 10px;
        }
        .download-buttons button {
          margin-right: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Upload Homework</h1>
        <form action="/upload" method="POST" enctype="multipart/form-data">
          <label for="date">Select Date:</label>
          <input type="date" name="date" id="date" required />
          
          <label for="subject">Select Subject:</label>
          <select name="subject" id="subject" required>
            <option value="Math">Math</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="History">History</option>
            <option value="Geography">Geography</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
          </select>

          <label for="title">Title:</label>
          <input type="text" name="title" id="title" required />

          <label for="description">Description:</label>
          <textarea name="description" id="description" rows="4" required></textarea>

          <label for="image">Choose Images:</label>
          <input type="file" name="image" id="image" multiple required />

          <label for="deleteAfter">Delete After:</label>
          <select name="deleteAfter" id="deleteAfter" required>
            <option value="24h">24 hours</option>
            <option value="2d">2 days</option>
            <option value="1w">1 week</option>
            <option value="5w">5 weeks</option>
          </select>

          <button type="submit">Upload</button>
        </form>
        <hr />
        <h2>Filter by Date and Subject</h2>
        <form action="/" method="GET">
          <input type="date" name="date" value="${filterDate || ''}" />
          <select name="subject">
            <option value="">All Subjects</option>
            <option value="Math">Math</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="History">History</option>
            <option value="Geography">Geography</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
          </select>
          <button type="submit">Filter</button>
        </form>
        <hr />
        <h2>Uploaded Homework Feed</h2>
        <div class="homework-feed">
  `;

  if (filteredFiles.length === 0) {
    html += '<p>No homework found for the selected criteria.</p>';
  } else {
    filteredFiles.forEach(file => {
      // Concatenate image paths into a string
      const filePaths = file.files.map(f => `/uploads/${f.filename}`).join(', ');

      html += `
        <div class="homework-post">
          <img src="${filePaths.split(',')[0]}" alt="${file.title}" />
          <div class="homework-details">
            <h3>${file.title}</h3>
            <p><strong>Subject:</strong> ${file.subject}</p>
            <p><strong>Date:</strong> ${file.date}</p>
            <p><strong>Description:</strong> ${file.description}</p>
            <p><strong>Images:</strong> ${file.files.length} images</p>
            <div class="download-buttons">
              <a href="/download/${file.date}/${file.subject}/${file.title}" download><button>Download as ZIP</button></a>
              <a href="/download/${file.date}/${file.subject}/${file.title}/direct"><button>Download Directly</button></a>
              <a href="/share/${file.date}/${file.subject}/${file.title}"><button>Share Link</button></a>
            </div>
          </div>
        </div>
      `;
    });
  }

  html += `
        </div>
      </div>
    </body>
    </html>
  `;

  res.send(html);
});

// Handle image upload
app.post('/upload', upload.array('image'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.send('No files uploaded.');
  }

  const { date, subject, title, description, deleteAfter } = req.body;
  const deleteTime = moment().add(getDeleteDuration(deleteAfter), 'milliseconds').toDate();

  const fileData = {
    files: req.files,
    date: date,
    subject: subject,
    title: title,
    description: description,
    deleteAfter: deleteTime // Store the calculated delete time
  };

  uploadedFiles.push(fileData); // Store file data in the array

  res.redirect('/');
});

// Helper function to get the duration for automatic deletion based on user input
function getDeleteDuration(deleteAfter) {
  switch (deleteAfter) {
    case '24h': return 24 * 60 * 60 * 1000;
    case '2d': return 2 * 24 * 60 * 60 * 1000;
    case '1w': return 7 * 24 * 60 * 60 * 1000;
    case '5w': return 5 * 7 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

// Create a download ZIP route
app.get('/download/:date/:subject/:title', (req, res) => {
  const { date, subject, title } = req.params;

  // Find the corresponding homework entry
  const fileData = uploadedFiles.find(file => file.date === date && file.subject === subject && file.title === title);

  if (!fileData) {
    return res.status(404).send('Homework not found.');
  }

  const archive = archiver('zip', { zlib: { level: 9 } });

  res.attachment(`${title}.zip`);

  archive.pipe(res);

  fileData.files.forEach(file => {
    archive.file(path.join(__dirname, 'uploads', file.filename), { name: file.originalname });
  });

  archive.finalize();
});

// Handle direct download option for individual files
app.get('/download/:date/:subject/:title/direct', (req, res) => {
  const { date, subject, title } = req.params;

  // Find the corresponding homework entry
  const fileData = uploadedFiles.find(file => file.date === date && file.subject === subject && file.title === title);

  if (!fileData) {
    return res.status(404).send('Homework not found.');
  }

  // For simplicity, download the first file
  const filePath = path.join(__dirname, 'uploads', fileData.files[0].filename);
  res.download(filePath);
});

// Share the files as a link
app.get('/share/:date/:subject/:title', (req, res) => {
  const { date, subject, title } = req.params;

  // Find the corresponding homework entry
  const fileData = uploadedFiles.find(file => file.date === date && file.subject === subject && file.title === title);

  if (!fileData) {
    return res.status(404).send('Homework not found.');
  }

  const shareLink = `${req.protocol}://${req.get('host')}/download/${fileData.date}/${fileData.subject}/${fileData.title}`;

  res.send(`
    <p>Share this link to download the homework:</p>
    <a href="${shareLink}">${shareLink}</a>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
