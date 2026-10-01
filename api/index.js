const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, '..')));

let bookings = [];

let services = [
    { id: 1, name: 'Classic Haircut', price: 28, duration: 30, description: 'A tailored cut, finished with a hot towel and style.' },
    { id: 2, name: 'Skin Fade', price: 35, duration: 45, description: 'A precise fade with clean detailing around the edges.' },
    { id: 3, name: 'Beard Sculpt', price: 22, duration: 30, description: 'Shape, line-up, and condition for a well-kept beard.' },
    { id: 4, name: 'Cut & Beard', price: 48, duration: 60, description: 'The full reset: a fresh haircut and a detailed beard finish.' },
    { id: 5, name: 'Buzz Cut', price: 20, duration: 20, description: 'An even, clean cut with a sharp neckline.' },
    { id: 6, name: 'Hot Towel Shave', price: 32, duration: 45, description: 'A close straight-razor shave with a hot towel finish.' },
    { id: 7, name: 'Kids Cut', price: 22, duration: 30, description: 'A patient, polished haircut for the next generation.' }
];


app.get('/api/services', (req, res) => {
    res.json(services);
});


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


app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', 'index.html')
    );
});


app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        error: 'Something went wrong!'
    });
});


module.exports = app;