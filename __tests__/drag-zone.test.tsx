import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { BottomSheet } from '../src';
import { isInDragZone } from '../src/utils/dom';

afterEach(cleanup);

describe('isInDragZone', () => {
  it('is true inside a [data-glidesheet-drag] zone', () => {
    render(
      <div data-glidesheet-drag="">
        <span data-testid="title">Title</span>
      </div>
    );
    expect(isInDragZone(screen.getByTestId('title'))).toBe(true);
  });

  it('is false outside any zone', () => {
    render(<span data-testid="free">Free</span>);
    expect(isInDragZone(screen.getByTestId('free'))).toBe(false);
  });

  it('lets a no-drag area nested in the zone win', () => {
    render(
      <div data-glidesheet-drag="">
        <div data-glidesheet-no-drag="">
          <span data-testid="carousel">Carousel</span>
        </div>
      </div>
    );
    expect(isInDragZone(screen.getByTestId('carousel'))).toBe(false);
  });

  it('keeps the zone when it sits inside a no-drag area', () => {
    render(
      <div data-glidesheet-no-drag="">
        <div data-glidesheet-drag="">
          <span data-testid="header">Header</span>
        </div>
      </div>
    );
    expect(isInDragZone(screen.getByTestId('header'))).toBe(true);
  });

  it('makes the Handle a drag zone', async () => {
    render(
      <BottomSheet.Root open modal={false}>
        <BottomSheet.Portal>
          <BottomSheet.Content>
            <BottomSheet.Handle data-testid="handle" />
            <BottomSheet.Title>Sheet</BottomSheet.Title>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet.Root>
    );
    await waitFor(() => screen.getByTestId('handle'));
    const hitArea = screen.getByTestId('handle').querySelector('[data-glidesheet-handle-hitarea]');
    expect(isInDragZone(hitArea)).toBe(true);
  });
});
