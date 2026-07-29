import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationProvider, useNotification } from '../NotificationContext';

const TestComponent: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  return (
    <div>
      <button onClick={() => showSuccess('Success!')}>Show Success</button>
      <button onClick={() => showError('Error!')}>Show Error</button>
      <button onClick={() => showWarning('Warning!')}>Show Warning</button>
      <button onClick={() => showInfo('Info!')}>Show Info</button>
    </div>
  );
};

describe('NotificationContext', () => {
  it('should render children', () => {
    render(
      <NotificationProvider>
        <div>Test Child</div>
      </NotificationProvider>
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should show success notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await act(async () => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('should show error notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await act(async () => {
      screen.getByText('Show Error').click();
    });

    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('should show warning notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await act(async () => {
      screen.getByText('Show Warning').click();
    });

    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });

  it('should show info notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await act(async () => {
      screen.getByText('Show Info').click();
    });

    expect(screen.getByText('Info!')).toBeInTheDocument();
  });
});
