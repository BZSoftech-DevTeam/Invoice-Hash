const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const server = express();

server.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

server.use(express.json({ limit: '50mb' }));
server.use(express.urlencoded({ limit: '50mb', extended: true }));

// API to handle the base64 XML data and run the Fatoora command
server.post('/hash-invoice', (req, res) => {
    const { base64 } = req.body;

    if (!base64) {
        return res.status(400).json({ error: 'No base64 data provided' });
    }

    try {
        // Decode base64 to string
        const xmlData = Buffer.from(base64, 'base64').toString('utf-8');

        // Create a unique file name
        const fileName = `invoice_${Date.now()}.xml`;

        // Define the path to the temp folder
        const tempFolderPath = path.join(__dirname, 'temp');

        // Ensure the 'temp' folder exists
        if (!fs.existsSync(tempFolderPath)) {
            fs.mkdirSync(tempFolderPath);
        }

        // Write the decoded XML to a file in the temp folder
        const filePath = path.join(tempFolderPath, fileName);
        fs.writeFileSync(filePath, xmlData, 'utf8');

        // Run the Fatoora command
        const command = `fatoora -invoice -generateHash ${filePath}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return res.status(500).json({ error: `Error executing command: ${error.message}` });
            }

            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return res.status(500).json({ error: stderr });
            }

            // Send the command output (stdout) as the response
            res.status(200).json({
                message: 'XML file saved and hash generated successfully',
                hashResponse: stdout.trim() // trim to remove any extra newline or spaces
            });
        });

    } catch (error) {
        console.error('Error saving XML file:', error);
        res.status(500).json({ error: 'Failed to save XML file' });
    }
});

server.get('/', (req, res) => {
    res.status(200).send('👋 A protected server for FATOORA Invoice Hashing');
});

const Port = 7810;
server.listen(Port, () => {
    console.log(`🖥️  =================== Server Initiated at Port# ${Port} =================== 🖥️`);
});
