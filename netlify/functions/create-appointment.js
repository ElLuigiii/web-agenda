const { google } = require('googleapis');

const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const TIME_ZONE = 'America/Montevideo';

exports.handler = async (event, context) => {
  if (event.httpMethod === 'GET') {
    const date = event.queryStringParameters.date;
    if (!date) {
      return { statusCode: 400, body: 'Falta la fecha en la consulta.' };
    }

    const auth = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const startOfDay = new Date(`${date}T11:00:00`);
    const endOfDay = new Date(`${date}T18:00:00`);

    const events = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: TIME_ZONE,
    });

    const occupiedHours = events.data.items.map(event => {
      const start = new Date(event.start.dateTime);
      return start.getHours();
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ occupiedHours }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido. Solo se acepta POST.' };
  }

  try {
    const data = JSON.parse(event.body);
    const { clientName, clientPhone, serviceType, appointmentDateTime } = data;

    const startTime = new Date(appointmentDateTime);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    // ✅ Ajustar la hora actual a la zona de Montevideo
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: TIME_ZONE }));
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const appointmentDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());

    if (appointmentDate < nowDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No se pueden agendar citas en fechas pasadas.' }),
      };
    }

    if (
      appointmentDate.getTime() === nowDate.getTime() &&
      startTime.getTime() < now.getTime()
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No se pueden agendar citas en una hora que ya pasó.' }),
      };
    }

    const hour = startTime.getHours();
    if (hour < 11 || hour >= 18) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Solo se pueden agendar citas entre las 11:00 y las 18:00 horas.' }),
      };
    }

    const auth = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const existingEvents = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      timeZone: TIME_ZONE,
      singleEvents: true,
      orderBy: 'startTime',
    });

    if (existingEvents.data.items.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Ya hay una cita agendada en ese horario. Elige otro.' }),
      };
    }

    const eventDetails = {
      summary: `${serviceType || 'Cita de Manicura'} - ${clientName}`,
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
      colorId: 10,
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: eventDetails,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cita agendada con éxito',
        eventLink: response.data.htmlLink,
      }),
    };
  } catch (error) {
    console.error('Error al agendar la cita:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error al agendar la cita. Por favor, revisa la consola para más detalles.',
        details: error.message,
      }),
    };
  }
};