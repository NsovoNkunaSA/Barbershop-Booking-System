
let allServices = [];

const defaultServices = [
    { id: 1, name: 'Classic Haircut', price: 60, duration: 30, description: 'A tailored cut, finished with a hot towel and style.' },
    { id: 2, name: 'Skin Fade', price: 65, duration: 45, description: 'A precise fade with clean detailing around the edges.' },
    { id: 3, name: 'Beard Sculpt', price: 35, duration: 30, description: 'Shape, line-up, and condition for a well-kept beard.' },
    { id: 4, name: 'Cut & Beard', price: 100, duration: 60, description: 'The full reset: a fresh haircut and a detailed beard finish.' },
    { id: 5, name: 'Buzz Cut', price: 60, duration: 20, description: 'An even, clean cut with a sharp neckline.' },
    { id: 6, name: 'Hot Towel Shave', price: 50, duration: 45, description: 'A close straight-razor shave with a hot towel finish.' },
    { id: 7, name: 'Kids Cut', price: 50, duration: 30, description: 'A patient, polished haircut for the next generation.' }
];

async function loadServices() {
    try {
        const response = await fetch('/api/services');
        if (!response.ok) {
            throw new Error('Services request failed');
        }
        allServices = await response.json();

        const servicesContainer = document.getElementById('servicesContainer');
        const serviceSelect = document.getElementById('service');
        servicesContainer.innerHTML = '';
        serviceSelect.innerHTML = '<option value="">Select a service</option>';
        if (!Array.isArray(allServices)) {
            throw new Error('Services response is invalid');
        }

        renderServices(allServices);
    } catch (error) {
        console.error('Error loading services:', error);
        loadDefaultServices();
    }
}

function loadDefaultServices() {
    renderServices(defaultServices);
}

function renderServices(services) {
    const servicesContainer = document.getElementById('servicesContainer');
    const serviceSelect = document.getElementById('service');
    servicesContainer.innerHTML = '';
    serviceSelect.innerHTML = '<option value="">Select a service</option>';

    services.forEach((service, index) => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.style.setProperty('--card-index', index);

        const icon = document.createElement('span');
        icon.className = 'service-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = '<i class="fas fa-scissors"></i>';

        const duration = document.createElement('p');
        duration.className = 'service-duration';
        duration.textContent = `${service.duration} min`;

        const name = document.createElement('h3');
        name.textContent = service.name;

        const description = document.createElement('p');
        description.className = 'service-description';
        description.textContent = service.description || 'Expert grooming, tailored to you.';

        const details = document.createElement('div');
        details.className = 'service-details';

        const price = document.createElement('span');
        price.className = 'price';
        price.textContent = `$${service.price}`;

        const bookButton = document.createElement('button');
        bookButton.className = 'service-book';
        bookButton.type = 'button';
        bookButton.setAttribute('aria-label', `Book ${service.name}`);
        bookButton.innerHTML = '<i class="fas fa-arrow-right" aria-hidden="true"></i>';
        bookButton.addEventListener('click', () => {
            serviceSelect.value = String(service.id);
            scrollToBooking();
        });

        details.append(price, bookButton);
        serviceCard.append(icon, duration, name, description, details);
        servicesContainer.appendChild(serviceCard);

        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.name} - $${service.price} (${service.duration} min)`;
        serviceSelect.appendChild(option);
    });
}

async function submitBooking(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const serviceId = document.getElementById('service').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    if (!name || !phone || !serviceId || !date || !time) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
        showMessage('Phone number should be 9-15 digits', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                phone, 
                serviceId: parseInt(serviceId), 
                date, 
                time 
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage(`✓ Booking confirmed! Thank you, ${name}. Your appointment is at ${time} on ${date}.`, 'success');
            document.getElementById('bookingForm').reset();
            loadTodayBookings();
        } else {
            showMessage(result.error || 'Booking failed', 'error');
        }
    } catch (error) {
        console.error('Booking error:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

async function loadTodayBookings() {
    try {
        const response = await fetch('/api/bookings/today');
        const data = await response.json();
        
        const container = document.getElementById('todayBookings');
        
        if (data.bookings.length === 0) {
            container.innerHTML = '<p>No bookings for today.</p>';
            return;
        }
        
        let html = `<div class="booking-list">
            <div style="display: flex; justify-content: space-between; padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;">
                <div><strong>Total Bookings:</strong> ${data.count}</div>
                <div><strong>Total Revenue:</strong> $${data.totalRevenue}</div>
            </div>`;
        
        data.bookings.forEach(booking => {
            html += `
                <div class="booking-item">
                    <div>
                        <strong>${booking.name}</strong><br>
                        ${booking.serviceName} at ${booking.time}<br>
                        Phone: ${booking.phone}
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #28a745;">$${booking.price}</div>
                        <button class="delete-btn" onclick="deleteBooking(${booking.id})">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('todayBookings').innerHTML = 
            '<p class="error">Failed to load bookings. Make sure server is running.</p>';
    }
}

async function deleteBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/bookings/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Booking cancelled successfully', 'success');
            loadTodayBookings();
        } else {
            const error = await response.json();
            showMessage(error.error || 'Failed to cancel booking', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('bookingMessage');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function scrollToBooking() {
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}


document.addEventListener('DOMContentLoaded', function() {
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').min = today;
    document.getElementById('date').value = today;
    
    
    loadServices();
    
    
    loadTodayBookings();
    

    document.getElementById('bookingForm').addEventListener('submit', submitBooking);
});


