import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { OptimizedImage } from '../OptimizedImage';

describe('OptimizedImage', () => {
  it('should render with src and alt', () => {
    render(<OptimizedImage src="/photo.jpg" alt="A photo" />);
    const img = screen.getByAltText('A photo');
    expect(img).toHaveAttribute('src', '/photo.jpg');
  });

  it('should have lazy loading by default', () => {
    render(<OptimizedImage src="/photo.jpg" alt="Photo" />);
    expect(screen.getByAltText('Photo')).toHaveAttribute('loading', 'lazy');
  });

  it('should have async decoding by default', () => {
    render(<OptimizedImage src="/photo.jpg" alt="Photo" />);
    expect(screen.getByAltText('Photo')).toHaveAttribute('decoding', 'async');
  });

  it('should fall back to placeholder on error', () => {
    render(<OptimizedImage src="/broken.jpg" alt="Broken" />);
    const img = screen.getByAltText('Broken');

    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/placeholder.svg');
  });

  it('should use custom fallback on error', () => {
    render(<OptimizedImage src="/broken.jpg" alt="Broken" fallback="/custom-fallback.png" />);
    const img = screen.getByAltText('Broken');

    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/custom-fallback.png');
  });

  it('should forward additional HTML attributes', () => {
    render(<OptimizedImage src="/photo.jpg" alt="Photo" className="w-full" data-testid="my-img" />);
    const img = screen.getByTestId('my-img');
    expect(img).toHaveClass('w-full');
  });
});
