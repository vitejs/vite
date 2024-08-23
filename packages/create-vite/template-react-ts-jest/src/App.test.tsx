import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event'
import App from './App';

describe('App Component', () => {
  test('renders the heading Vite + React', () => {
    render(<App />);
    const headingElement = screen.getByText(/Vite \+ React/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders the initial count value of 0', () => {
    render(<App />);
    const countButton = screen.getByRole('button', { name: /count is 0/i });
    expect(countButton).toBeInTheDocument();
  });

  test('increments the count when the button is clicked', () => {
    render(<App />);
    const countButton = screen.getByRole('button', { name: /count is 0/i });
    
    userEvent.click(countButton);
    expect(countButton).toHaveTextContent('count is 1');
    
    userEvent.click(countButton);
    expect(countButton).toHaveTextContent('count is 2');
  });

  test('renders the "read the docs" paragraph', () => {
    render(<App />);
    const docsParagraph = screen.getByText(/Click on the Vite and React logos to learn more/i);
    expect(docsParagraph).toBeInTheDocument();
  });
});
