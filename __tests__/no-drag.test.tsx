import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { BottomSheet } from '../src';
import { DRAG_CLASS } from '../src/constants';

afterEach(cleanup);

// shouldDrag refuses any drag in the first 500ms after opening.
const pastOpenGuard = () => new Promise((r) => setTimeout(r, 550));

async function renderWithCarousel() {
  render(
    <BottomSheet.Root open modal={false}>
      <BottomSheet.Portal>
        <BottomSheet.Content data-testid="content">
          <BottomSheet.Title>Sheet</BottomSheet.Title>
          <div data-glidesheet-no-drag="">
            <span data-testid="card">Card</span>
          </div>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet.Root>
  );
  await waitFor(() => expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open'));
  await pastOpenGuard();
  const content = screen.getByTestId('content');
  return { isDragging: () => content.classList.contains(DRAG_CLASS), card: screen.getByTestId('card') };
}

// happy-dom drops coordinates from PointerEvent init: set them by hand.
function pointer(type: string, x: number, y: number) {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch' });
  Object.defineProperties(event, { pageX: { value: x }, pageY: { value: y } });
  return event;
}

function swipe(target: HTMLElement, dx: number, dy: number) {
  fireEvent(target, pointer('pointerdown', 100, 300));
  for (let i = 1; i <= 4; i++) {
    fireEvent(target, pointer('pointermove', 100 + (dx * i) / 4, 300 + (dy * i) / 4));
  }
}

describe('no-drag area', () => {
  it('hands a vertical swipe to the sheet', async () => {
    const { isDragging, card } = await renderWithCarousel();
    swipe(card, 0, 120);
    expect(isDragging()).toBe(true);
  });

  it('keeps a horizontal swipe, even slightly diagonal', async () => {
    const { isDragging, card } = await renderWithCarousel();
    swipe(card, 120, 40);
    expect(isDragging()).toBe(false);
  });
});
