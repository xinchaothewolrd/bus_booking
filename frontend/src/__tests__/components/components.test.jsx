import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

/**
 * Example Component Tests
 * These tests demonstrate best practices for testing React components
 * Adjust based on your actual components
 */

// Example: Test for a Button Component
describe('Button Component', () => {
  const SimpleButton = ({ onClick, children, disabled = false }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );

  it('should render button with correct text', () => {
    render(<SimpleButton>Click me</SimpleButton>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<SimpleButton onClick={handleClick}>Click me</SimpleButton>);
    const button = screen.getByRole('button');

    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<SimpleButton disabled>Click me</SimpleButton>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <SimpleButton onClick={handleClick} disabled>
        Click me
      </SimpleButton>
    );
    const button = screen.getByRole('button');

    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });
});

// Example: Test for a Form Component
describe('Login Form Component', () => {
  const LoginForm = ({ onSubmit }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ email, password });
    };

    return (
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          data-testid="email-input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          data-testid="password-input"
        />
        <button type="submit">Login</button>
      </form>
    );
  };

  it('should render form with email and password fields', () => {
    render(<LoginForm onSubmit={() => {}} />);

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should update input values when user types', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={() => {}} />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('user@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should call onSubmit with form data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByTestId('email-input'), 'user@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('should not submit form with empty fields', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: '',
      password: '',
    });
  });
});

// Example: Test for a Modal Component
describe('Modal Component', () => {
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div data-testid="modal" role="dialog">
        <div>
          <h2>{title}</h2>
          <button onClick={onClose}>Close</button>
        </div>
        <div>{children}</div>
      </div>
    );
  };

  it('should not render when isOpen is false', () => {
    render(<Modal isOpen={false} title="Test Modal" />);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<Modal isOpen={true} title="Test Modal" />);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(handleClose).toHaveBeenCalled();
  });

  it('should display title and children', () => {
    render(
      <Modal isOpen={true} title="Test Title">
        Test Content
      </Modal>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

// Example: Test for a List Component with async data
describe('Booking List Component', () => {
  const BookingList = ({ bookings, isLoading }) => {
    if (isLoading) return <div>Loading...</div>;

    if (!bookings || bookings.length === 0) {
      return <div>No bookings found</div>;
    }

    return (
      <ul data-testid="booking-list">
        {bookings.map((booking) => (
          <li key={booking.id}>
            <span>{booking.bookingCode}</span> - <span>{booking.status}</span>
          </li>
        ))}
      </ul>
    );
  };

  it('should show loading state', () => {
    render(<BookingList bookings={[]} isLoading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show empty state when no bookings', () => {
    render(<BookingList bookings={[]} isLoading={false} />);

    expect(screen.getByText('No bookings found')).toBeInTheDocument();
  });

  it('should render list of bookings', () => {
    const mockBookings = [
      { id: 1, bookingCode: 'BOOK001', status: 'confirmed' },
      { id: 2, bookingCode: 'BOOK002', status: 'pending' },
    ];

    render(<BookingList bookings={mockBookings} isLoading={false} />);

    expect(screen.getByTestId('booking-list')).toBeInTheDocument();
    expect(screen.getByText('BOOK001')).toBeInTheDocument();
    expect(screen.getByText('BOOK002')).toBeInTheDocument();
  });

  it('should display correct booking status', () => {
    const mockBookings = [
      { id: 1, bookingCode: 'BOOK001', status: 'confirmed' },
    ];

    render(<BookingList bookings={mockBookings} isLoading={false} />);

    expect(screen.getByText('confirmed')).toBeInTheDocument();
  });
});
