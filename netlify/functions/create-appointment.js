const { google } = require('googleapis');

// 1. Cargar las Variables de Entorno de Netlify
// Netlify las hace accesibles a través de process.env
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
// Importante: Reemplazar los caracteres \n por saltos de línea reales para la clave privada
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'); 
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID; 
// Ajusta tu zona horaria para asegurarte de que la hora se guarde correctamente
const TIME_ZONE = 'America/Montevideo'; 

exports.handler = async (event, context) => {
    
    // 2. Control de Método HTTP
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido. Solo se acepta POST.' };
    }

    try {
        // 3. Parsear los datos enviados desde el frontend (script.js)
        const data = JSON.parse(event.body);
        const { 
            clientName, 
            clientPhone, 
            serviceType, 
            appointmentDateTime 
        } = data;
        
        // 4. Autenticación con Google API usando la Cuenta de Servicio
        const auth = new google.auth.JWT({
            email: CLIENT_EMAIL,
            key: PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/calendar'], // Permiso para escribir en el calendario
        });

        const calendar = google.calendar({ version: 'v3', auth });
        
        // 5. Crear el Objeto Evento de Google Calendar
        const startTime = new Date(appointmentDateTime);
        
        // Asume una duración predeterminada de 60 minutos (1 hora)
        // Puedes cambiar esto si los servicios tienen diferente duración
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); 

        const eventDetails = {
            // Título del evento
            summary: `${serviceType || 'Cita de Manicura'} - ${clientName}`, 
            
            // Descripción detallada
            description: `
                Cliente: ${clientName}
                Teléfono: ${clientPhone || 'No proporcionado'}
                Servicio: ${serviceType || 'No especificado'}
                Reserva generada automáticamente desde la web.
            `,
            
            start: {
                dateTime: startTime.toISOString(),
                timeZone: TIME_ZONE,
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: TIME_ZONE,
            },
            // ColorId (opcional): Puedes asignarle un color para que se distinga fácilmente en tu calendario
            colorId: 10, // Por ejemplo, 10 es verde. (Puedes buscar la lista de colores de GCal API)
        };

        // 6. Insertar el evento en tu calendario
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: eventDetails,
        });

        console.log(`Evento creado. Link: ${response.data.htmlLink}`);

        // 7. Devolver una respuesta exitosa al frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: 'Cita agendada con éxito', 
                eventLink: response.data.htmlLink 
            }),
        };

    } catch (error) {
        // 8. Manejar y reportar errores
        console.error('Error al agendar la cita:', error.message);
        
        // Devolver un error al frontend para que el usuario sepa que algo falló
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Error al agendar la cita. Por favor, revisa la consola para más detalles.', 
                details: error.message 
            }),
        };
    }
};