const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const lockFile = require('lockfile');

// Define the path to your JSON file
const jsonFilePath = path.join(__dirname, '..', 'data', 'players.json');
const lockFilePath = path.join(__dirname, '..', 'data', 'players.lock');

router.get('/', (req, res) => {
    res.render('home', { title: 'My HTML Page' });
});

router.get('/servers-data', (req, res) => {
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            return res.status(500).send('Server error');
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData); // Send JSON data to client
        } catch (err) {
            console.error('Error parsing JSON data:', err);
            return res.status(500).send('Server error');
        }
    });
});

router.post('/create-server', (req, res) => {
    lockFile.lock(lockFilePath, { wait: 5000 }, (lockErr) => {
        if (lockErr) {
            console.error('Error acquiring lock:', lockErr);
            return res.status(500).send('Server error');
        }

        fs.readFile(jsonFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading JSON file:', err);
                lockFile.unlock(lockFilePath, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
                return;
            }

            try {
                const jsonData = JSON.parse(data);
                const newServerIndex = jsonData.length;
                const newServer = { index: newServerIndex, players: 0, user1: "", user2: "", block: 1 };
                jsonData.push(newServer);

                fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error('Error writing to JSON file:', writeErr);
                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                            return res.status(500).send('Server error');
                        });
                        return;
                    }

                    lockFile.unlock(lockFilePath, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        res.json(newServer);
                    });
                });
            } catch (err) {
                console.error('Error parsing JSON data:', err);
                lockFile.unlock(lockFilePath, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
            }
        });
    });
});

router.post('/submit', (req, res) => {
    const { inputText, index } = req.body;

    lockFile.lock(lockFilePath, { wait: 5000 }, (lockErr) => {
        if (lockErr) {
            console.error('Error acquiring lock:', lockErr);
            return res.status(500).send('Server error');
        }

        fs.readFile(jsonFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading JSON file:', err);
                lockFile.unlock(lockFilePath, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
                return;
            }

            try {
                const jsonData = JSON.parse(data);
                const server = jsonData[index];

                if (!server) {
                    lockFile.unlock(lockFilePath, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        return res.status(400).send('Invalid server index');
                    });
                    return;
                }

                let player = 0;

                if (server.user1 === "") {
                    server.user1 = inputText;
                    server.players++;
                    player = 1;
                    server.block = 0;
                } else if (server.user2 === "") {
                    server.user2 = inputText;
                    server.players++;
                    player = 2;
                } else {
                    lockFile.unlock(lockFilePath, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        return res.status(400).send('Server is full');
                    });
                    return;
                }

                fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error('Error writing to JSON file:', writeErr);
                        lockFile.unlock(lockFilePath, (unlockErr) => {
                            if (unlockErr) {
                                console.error('Error releasing lock:', unlockErr);
                            }
                            return res.status(500).send('Server error');
                        });
                        return;
                    }

                    lockFile.unlock(lockFilePath, (unlockErr) => {
                        if (unlockErr) {
                            console.error('Error releasing lock:', unlockErr);
                        }
                        res.json({ index, players: server.players, player });
                    });
                });
            } catch (err) {
                console.error('Error parsing JSON data:', err);
                lockFile.unlock(lockFilePath, (unlockErr) => {
                    if (unlockErr) {
                        console.error('Error releasing lock:', unlockErr);
                    }
                    return res.status(500).send('Server error');
                });
            }
        });
    });
});

module.exports = router;
