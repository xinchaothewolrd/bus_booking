import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

/**
 * Example service testing for API calls
 * Adjust based on your actual service implementation
 */

describe('Booking Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch bookings successfully', async () => {
    const mockBookings = [
      {
        id: 1,
        bookingCode: 'BOOK001',
        totalPrice: 500000,
        status: 'confirmed',
      },
      {
        id: 2,
        bookingCode: 'BOOK002',
        totalPrice: 350000,
        status: 'pending',
      },
    ];

    axios.get.mockResolvedValue({
      data: { data: mockBookings },
      status: 200,
    });

    // Simulate service call
    const response = await axios.get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.data.data).toHaveLength(2);
    expect(response.data.data[0].bookingCode).toBe('BOOK001');
  });

  it('should create booking successfully', async () => {
    const newBooking = {
      tripId: 1,
      totalPrice: 500000,
      passengers: [
        { name: 'Nguyen Van A', seatId: 1 },
        { name: 'Tran Thi B', seatId: 2 },
      ],
    };

    const mockResponse = {
      id: 1,
      bookingCode: 'BOOK123',
      ...newBooking,
      status: 'pending',
    };

    axios.post.mockResolvedValue({
      data: mockResponse,
      status: 201,
    });

    const response = await axios.post('/api/bookings', newBooking);

    expect(response.status).toBe(201);
    expect(response.data.bookingCode).toBe('BOOK123');
    expect(response.data.status).toBe('pending');
  });

  it('should handle booking error', async () => {
    const errorMessage = 'Trip not found';

    axios.get.mockRejectedValue({
      response: {
        status: 404,
        data: { message: errorMessage },
      },
    });

    try {
      await axios.get('/api/bookings/999');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.message).toBe(errorMessage);
    }
  });

  it('should cancel booking successfully', async () => {
    axios.put.mockResolvedValue({
      data: {
        id: 1,
        status: 'cancelled',
        message: 'Booking cancelled successfully',
      },
      status: 200,
    });

    const response = await axios.put('/api/bookings/1/cancel');

    expect(response.data.status).toBe('cancelled');
    expect(response.data.message).toContain('successfully');
  });

  it('should fetch booking by ID', async () => {
    const mockBooking = {
      id: 1,
      bookingCode: 'BOOK001',
      tripId: 1,
      totalPrice: 500000,
      tickets: [
        { id: 1, seatNumber: 'A1', passengerName: 'Nguyen Van A' },
        { id: 2, seatNumber: 'A2', passengerName: 'Tran Thi B' },
      ],
      status: 'confirmed',
    };

    axios.get.mockResolvedValue({
      data: mockBooking,
      status: 200,
    });

    const response = await axios.get('/api/bookings/1');

    expect(response.data.id).toBe(1);
    expect(response.data.tickets).toHaveLength(2);
    expect(response.data.tickets[0].seatNumber).toBe('A1');
  });
});

describe('Route Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch routes successfully', async () => {
    const mockRoutes = [
      {
        id: 1,
        routeName: 'Ha Noi - Ho Chi Minh',
        distance: 1600,
      },
      {
        id: 2,
        routeName: 'Ha Noi - Da Nang',
        distance: 800,
      },
    ];

    axios.get.mockResolvedValue({
      data: { data: mockRoutes },
      status: 200,
    });

    const response = await axios.get('/api/routes');

    expect(response.data.data).toHaveLength(2);
    expect(response.data.data[0].routeName).toBe('Ha Noi - Ho Chi Minh');
  });

  it('should search routes with filters', async () => {
    const filters = {
      departure: 'Ha Noi',
      arrival: 'Ho Chi Minh',
      date: '2026-05-25',
    };

    const mockResults = [
      {
        id: 1,
        routeName: 'Ha Noi - Ho Chi Minh',
        trips: [
          { id: 1, departureTime: '08:00', availableSeats: 20 },
        ],
      },
    ];

    axios.get.mockResolvedValue({
      data: { data: mockResults },
      status: 200,
    });

    const response = await axios.get('/api/routes/search', { params: filters });

    expect(response.data.data).toBeDefined();
    expect(response.data.data[0].trips).toBeDefined();
  });
});
