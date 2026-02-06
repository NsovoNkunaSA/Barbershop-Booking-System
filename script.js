
let allServices = [];

async function loadServices() {
    try {
        const response = await fetch('/api/services');
        allServices = await response.json();
        
        const servicesContainer = document.getElementById('servicesContainer');
        const serviceSelect = document.getElementById('service');
        
        
        servicesContainer.innerHTML = '';
        serviceSelect.innerHTML = '<option value="">Select a service</option>';
        
        if (Array.isArray(allServices)) {
            allServices.forEach(service => {
                
                const serviceCard = document.createElement('div');
                serviceCard.className = 'service-card';
                serviceCard.innerHTML = `
                    <h3>${service.name}</h3>
                    <p>${service.duration} minutes</p>
                    <div class="price">$${service.price}</div>
                    <p>Expert grooming for a sharp look</p>
                `;
                servicesContainer.appendChild(serviceCard);
                
                
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = `${service.name} - $${service.price} (${service.duration} min)`;
                serviceSelect.appendChild(option);
            });
        } else {
            console.error('Services is not an array:', allServices);
            servicesContainer.innerHTML = '<p>Error loading services. Using default services.</p>';
            loadDefaultServices();
        }
    } catch (error) {
        console.error('Error loading services:', error);
        document.getElementById('servicesContainer').innerHTML = 
            '<p class="error">Failed to load services. Check if server is running.</p>';
        loadDefaultServices();
    }
}


function loadDefaultServices() {
    const defaultServices = [
        { id: 1, name: 'Haircut', price: 25, duration: 30 },
        { id: 2, name: 'Beard Trim', price: 15, duration: 20 },
        { id: 3, name: 'Haircut & Beard', price: 35, duration: 45 }
    ];
    
    const servicesContainer = document.getElementById('servicesContainer');
    const serviceSelect = document.getElementById('service');
    
    servicesContainer.innerHTML = '';
    defaultServices.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.innerHTML = `
            <h3>${service.name}</h3>
            <p>${service.duration} minutes</p>
            <div class="price">$${service.price}</div>
        `;
        servicesContainer.appendChild(serviceCard);
        
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.name} - $${service.price}`;
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
    
    
    const phoneRegex = /^[0-9+\-\(\)\s]{10,15}$/;

// And update the test:
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
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


