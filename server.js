// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const pty = require('node-pty');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 6080;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
    console.log('🔌 Client connected');

    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env
    });

    ptyProcess.on('data', data => socket.emit('output', data));
    socket.on('input', input => ptyProcess.write(input));

    socket.on('resize', size => {
        ptyProcess.resize(size.cols, size.rows);
    });

    socket.on('disconnect', () => {
        ptyProcess.kill();
        console.log('❌ Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
