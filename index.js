// Asegúrate de que este script se ejecute después de que el HTML haya cargado
document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtén una referencia al formulario de agendamiento
    const appointmentForm = document.getElementById('appointment-form');
    
    // 2. Agrega un listener para cuando se envíe el formulario
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleFormSubmit);
    }
});

async function handleFormSubmit(event) {
    event.preventDefault(); // Detiene el envío clásico del formulario

    const form = event.target;
    
    // Obtener los valores del formulario
    // **NOTA:** Debes asegurar que estos IDs (client-name, appointment-date, appointment-time) coincidan con tu HTML
    const clientName = form.elements['client-name'].value;
    const appointmentDate = form.elements['appointment-date'].value;
    const appointmentTime = form.elements['appointment-time'].value;
    
    // Crear el formato de fecha y hora que Google Calendar espera (ISO 8601)
    // Ejemplo: '2025-11-20T15:00:00'
    const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;

    // 3. Preparar los datos para enviar a la Netlify Function
    const appointmentData = {
        clientName: clientName,
        appointmentDateTime: appointmentDateTime,
    };

    const functionPath = '/.netlify/functions/create-appointment'; // La ruta a tu función
    
    // Muestra un mensaje de carga al usuario
    // document.getElementById('message-area').textContent = "Agendando cita, por favor espere...";

    try {
        // 4. Hacer la petición POST a la Netlify Function
        const response = await fetch(functionPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentData),
        });

        const data = await response.json();

        // 5. Manejar la respuesta
        if (response.ok) {
            alert(`¡Cita agendada con éxito para ${clientName}! Revisa tu calendario.`);
            // Opcional: limpiar el formulario o redirigir
            form.reset();
        } else {
            // Manejar errores devueltos por la Netlify Function (status 500, etc.)
            alert(`Error al agendar la cita: ${data.message || 'Error desconocido'}`);
            console.error('Detalles del error:', data.details);
        }

    } catch (error) {
        // Manejar errores de red (si la función no existe o no se pudo conectar)
        alert('Error de conexión o de red. Inténtalo de nuevo.');
        console.error('Error de fetch:', error);
    }

    //FUNCIONES DEL CARROUSEL
    const images = [
        './img/img-design.png',
        './img/bunner-fondo.png',
        './img/img-design.png',
        './img/bunner-fondo.png',
        './img/img-design.png',
        './img/bunner-fondo.png'
        ];

    const carouselImage = document.getElementById('carousel-image');
  const indicators = document.querySelectorAll('.indicator');

  if (!carouselImage || indicators.length === 0) {
    console.error('No se encontró el carrusel o los indicadores.');
    return;
  }

  indicators.forEach(indicator => {
    indicator.addEventListener('click', function () {
      const index = parseInt(this.dataset.index);
      carouselImage.src = images[index];

      indicators.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  
    });
}