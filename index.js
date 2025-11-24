document.addEventListener('DOMContentLoaded', () => {
  const appointmentForm = document.getElementById('appointment-form');
  const appointmentDateInput = document.getElementById('appointment-date');
  const appointmentTimeInput = document.getElementById('appointment-time');
  const timeOptionsContainer = document.createElement('div');
  timeOptionsContainer.id = 'time-options';
  appointmentDateInput.parentNode.insertBefore(timeOptionsContainer, appointmentTimeInput);

  // ✅ Bloquear fechas pasadas
  const today = new Date().toISOString().split('T')[0];
  appointmentDateInput.setAttribute('min', today);

  // ✅ Cargar horarios disponibles al cambiar la fecha
  appointmentDateInput.addEventListener('change', async () => {
    const selectedDate = appointmentDateInput.value;
    if (!selectedDate) return;

    timeOptionsContainer.innerHTML = '<p>Verificando disponibilidad...</p>';

    try {
      const response = await fetch(`/.netlify/functions/create-appointment?date=${selectedDate}`);
      const data = await response.json();
      const occupied = data.occupiedHours || [];

      timeOptionsContainer.innerHTML = '<p>Selecciona un horario:</p>';

      for (let hour = 11; hour < 18; hour++) {
        const button = document.createElement('button');
        button.textContent = `${hour}:00`;
        button.disabled = occupied.includes(hour);
        button.className = occupied.includes(hour) ? 'disabled-time' : 'available-time';

        if (!button.disabled) {
          button.addEventListener('click', () => {
            appointmentTimeInput.value = `${hour.toString().padStart(2, '0')}:00`;
          });
        }

        timeOptionsContainer.appendChild(button);
      }
    } catch (error) {
      console.error('Error al consultar disponibilidad:', error);
      timeOptionsContainer.innerHTML = '<p>Error al cargar horarios disponibles.</p>';
    }
  });

  // ✅ Enviar formulario
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', handleFormSubmit);
  }

  // ✅ Carrusel
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

  if (carouselImage && indicators.length > 0) {
    indicators.forEach(indicator => {
      indicator.addEventListener('click', function () {
        const index = parseInt(this.dataset.index);
        carouselImage.src = images[index];

        indicators.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }
});

async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const clientName = form.elements['client-name'].value;
  const appointmentDate = form.elements['appointment-date'].value;
  const appointmentTime = form.elements['appointment-time'].value;
  const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;

  const appointmentData = {
    clientName,
    appointmentDateTime,
  };

  try {
    const response = await fetch('/.netlify/functions/create-appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData),
    });

    const data = await response.json();

    if (response.ok) {
      alert(`¡Cita agendada con éxito para ${clientName}!`);
      form.reset();
      document.getElementById('time-options').innerHTML = '';
    } else {
      alert(`Error al agendar la cita: ${data.message || 'Error desconocido'}`);
      console.error('Detalles del error:', data.details);
    }
  } catch (error) {
    alert('Error de conexión. Inténtalo de nuevo.');
    console.error('Error de fetch:', error);
  }
}