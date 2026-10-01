const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, '..')));

let bookings = [];

let services = [
    { id: 1, name: 'Haircut', price: 25, duration: 30 },
    { id: 2, name: 'Beard Trim', price: 15, duration: 20 },
    { id: 3, name: 'Haircut & Beard', price: 35, duration: 45 }
];


// Get services
app.get('/api/services', (req, res) => {
    res.json(services);
});


// Create booking
app.post('/api/book', (req, res) => {
    const { name, phone, serviceId, date, time } = req.body;

    if (!name || !serviceId || !phone || !date || !time) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }

    const conflict = bookings.find(
        booking => booking.date === date && booking.time === time
    );

    if (conflict) {
        return res.status(409).json({
            error: 'Time slot already booked'
        });
    }

    const service = services.find(
        service => service.id === parseInt(serviceId)
    );

    if (!service) {
        return res.status(404).json({
            error: 'Service not found'
        });
    }

    const newBooking = {
        id: bookings.length + 1,
        name,
        phone,
        serviceId: parseInt(serviceId),
        serviceName: service.name,
        price: service.price,
        date,
        time,
        status: 'confirmed',
        createdAt: new Date()
    };

    bookings.push(newBooking);

    console.log('New booking:', newBooking);

    res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: newBooking
    });
});


// Get today's bookings
app.get('/api/bookings/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    const todayBookings = bookings.filter(
        booking => booking.date === today
    );

    let totalRevenue = 0;

    todayBookings.forEach(booking => {
        totalRevenue += booking.price;
    });

    res.json({
        count: todayBookings.length,
        bookings: todayBookings,
        totalRevenue: totalRevenue
    });
});


// Delete booking
app.delete('/api/bookings/:id', (req, res) => {
    const id = parseInt(req.params.id);

    const initialLength = bookings.length;

    bookings = bookings.filter(
        booking => booking.id !== id
    );

    if (bookings.length === initialLength) {
        return res.status(404).json({
            error: 'Booking not found'
        });
    }

    res.json({
        success: true,
        message: 'Booking deleted'
    });
});


// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', 'index.html')
    );
});


// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        error: 'Something went wrong!'
    });
});


module.exports = app;