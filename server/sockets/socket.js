const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {


        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            });
        }

        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);

        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Administrador', `${ data.nombre } se unió`));

        callback(usuarios.getPersonasPorSala(data.sala));

    });

    client.on('crearMensaje', (data, callback) => {

        let persona = usuarios.getPersona(client.id);


        const translate = require('@k3rn31p4nic/google-translate-api');
        let traduccion;

        translate(data.mensaje, traduccion, { to: 'en' }).then(res => {
            let mensaje = crearMensaje(persona.nombre, data.mensaje);
            let mensajeEspanol = crearMensaje(persona.nombre, data.mensaje);
            mensaje.mensaje = res.text;
            let arrayMensajes = [mensaje, mensajeEspanol];
            client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
            callback(arrayMensajes);
        }).catch(err => {
            console.error(err);
        });






    });


    client.on('disconnect', () => {

        let personaBorrada = usuarios.borrarPersona(client.id);

        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${ personaBorrada.nombre } salió`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));


    });

    // Mensajes privados
    client.on('mensajePrivado', data => {

        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));

    });

});