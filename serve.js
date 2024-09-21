const io = require('socket.io')(3000);

let usuariosConectados = {}; // Objeto para almacenar los usuarios por su ID de socket

// Servidor escuchando en el puerto 3000
console.log('Servidor escuchando en el puerto 3000');

// Función para enviar mensajes desde el servidor a todos los usuarios
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin//,
    //output: process.stdout
});

rl.on('line', (input) => {
    if (input.startsWith('/ban')) {
        // Comando /ban para banear a un usuario desde el servidor
        const usuarioBan = input.split(' ')[1];
        const socketId = Object.keys(usuariosConectados).find(id => usuariosConectados[id] === usuarioBan);

        if (socketId) {
            io.sockets.sockets.get(socketId).disconnect();
            io.emit('mensaje', `El servidor ha baneado a ${usuarioBan}`);
            console.log(`El servidor ha baneado a ${usuarioBan}`);
        } else {
            console.log('Usuario no encontrado.');
        }
    }else if(input.startsWith('/list')) {
        // Comando /list para listar usuarios conectados
        const listaUsuarios = Object.values(usuariosConectados);
        console.log('Usuarios conectados:');
        listaUsuarios.forEach(usuario => console.log(`- ${usuario}`));
    } else if (input.startsWith('/help')) {
        // Comando /help para mostrar los comandos disponibles
        const comandos = `
Comandos disponibles:
/list - Listar todos los usuarios conectados
/ban <usuario> - Banear a un usuario del chat (solo servidor)
/help - Mostrar los comandos disponibles
@<usuario> <mensaje> - Enviar un mensaje privado a un usuario
        `;
        console.log(comandos);
    } else {
        // Enviar mensaje a todos los usuarios desde el servidor
        io.emit('mensaje', `Servidor: ${input}`);
        //console.log(`a ${input}`);
    }
});

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Cuando el cliente se conecta, espera el nombre de usuario
    socket.on('registrarUsuario', (username) => {
        usuariosConectados[socket.id] = username;
        console.log(`${username} se ha conectado`);

        // Notificar a todos los clientes sobre el nuevo usuario
        io.emit('mensaje', `${username} se ha conectado`);
    });

    // Escucha mensajes del cliente
    socket.on('mensaje', (msg) => {
        const username = usuariosConectados[socket.id];

        if (msg.startsWith('@')) {
            // Mensaje privado a un usuario con @username
            const usuarioObjetivo = msg.split(' ')[0].substring(1);
            const mensajePrivado = msg.split(' ').slice(1).join(' ');

            const socketId = Object.keys(usuariosConectados).find(id => usuariosConectados[id] === usuarioObjetivo);

            if (socketId) {
                io.sockets.sockets.get(socketId).emit('mensajePrivado', `${username} (privado): ${mensajePrivado}`);
                socket.emit('mensajePrivado', `A ${usuarioObjetivo} (privado): ${mensajePrivado}`);
            } else {
                socket.emit('mensaje', 'Usuario no encontrado.');
            }
        } else if (msg.startsWith('/list')) {
            // Comando /list para listar los usuarios conectados
            const listaUsuarios = Object.values(usuariosConectados);
            socket.emit('listaUsuarios', listaUsuarios);
        } else if (msg.startsWith('/help')) {
            // Comando /help para mostrar los comandos disponibles
            const comandos = `
Comandos disponibles:
/list - Listar todos los usuarios conectados
/help - Mostrar los comandos disponibles
@<usuario> <mensaje> - Enviar un mensaje privado a un usuario
            `;
            socket.emit('mensaje', comandos);
        } else {
            // Registrar y reenviar mensaje público
            console.log(`${username}: ${msg}`);
            io.emit('mensaje', `${username}: ${msg}`);
        }
    });

    // Detectar cuando un cliente se desconecta
    socket.on('disconnect', () => {
        const username = usuariosConectados[socket.id];
        if (username) {
            io.emit('mensaje', `${username} se ha desconectado`);
            delete usuariosConectados[socket.id]; // Eliminar usuario desconectado de la lista
        }
    });
});
