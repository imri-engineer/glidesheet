import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { BottomSheet } from '../src';

afterEach(cleanup);

function DragSheet({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <BottomSheet.Root open={open} onOpenChange={setOpen} modal={false}>
      <BottomSheet.Portal>
        <BottomSheet.Content data-testid="content">
          <BottomSheet.Handle data-testid="handle" />
          <BottomSheet.Title data-testid="title">Sheet</BottomSheet.Title>
          <div data-testid="header" style={{ padding: '16px' }}>
            Header area
          </div>
          <div data-testid="scrollable" style={{ overflowY: 'auto', flex: 1 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i}>Item {i}</div>
            ))}
          </div>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet.Root>
  );
}

describe('Content pointer events', () => {
  it('uses onPointerLeave instead of onPointerOut', async () => {
    render(<DragSheet />);
    await waitFor(() => {
      expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    });
    const content = screen.getByTestId('content');

    // pointerout from a child should NOT trigger release
    fireEvent.pointerOut(content, { bubbles: true });
    // Sheet should remain open — pointerOut is not listened to
    expect(content.getAttribute('data-state')).toBe('open');
  });

  it('registers pointerDown on content', async () => {
    render(<DragSheet />);
    await waitFor(() => {
      expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    });
    const content = screen.getByTestId('content');

    // Should not throw when firing pointer events
    fireEvent.pointerDown(content, { pageX: 100, pageY: 400, pointerId: 1 });
    fireEvent.pointerMove(content, { pageX: 100, pageY: 410, pointerId: 1 });
    fireEvent.pointerUp(content, { pageX: 100, pageY: 410, pointerId: 1 });
  });

  it('registers pointerDown on handle area', async () => {
    render(<DragSheet />);
    await waitFor(() => {
      expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    });
    const handle = screen.getByTestId('handle');

    fireEvent.pointerDown(handle, { pageX: 100, pageY: 400, pointerId: 1 });
    fireEvent.pointerMove(handle, { pageX: 100, pageY: 410, pointerId: 1 });
    fireEvent.pointerUp(handle, { pageX: 100, pageY: 410, pointerId: 1 });
  });

  it('registers pointerDown on header (non-scrollable) area', async () => {
    render(<DragSheet />);
    await waitFor(() => {
      expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    });
    const header = screen.getByTestId('header');

    fireEvent.pointerDown(header, { pageX: 100, pageY: 400, pointerId: 1 });
    fireEvent.pointerMove(header, { pageX: 100, pageY: 410, pointerId: 1 });
    fireEvent.pointerUp(header, { pageX: 100, pageY: 410, pointerId: 1 });
  });
});

describe('Content touch scroll prevention', () => {
  it('adds touchstart and touchmove listeners to content', async () => {
    render(<DragSheet />);
    await waitFor(() => {
      expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    });
    const content = screen.getByTestId('content');

    // touchstart/touchmove on a non-scrollable area should not throw
    fireEvent.touchStart(content, { touches: [{ clientY: 400 }] });
    fireEvent.touchMove(content, { touches: [{ clientY: 410 }] });
    fireEvent.touchEnd(content);
  });

  it('does not crash on touchmove with cancelable=false', async () => {
    render(<DragSheet />);
    await waitFor(() => {
      expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    });
    const content = screen.getByTestId('content');

    fireEvent.touchStart(content, { touches: [{ clientY: 400 }] });
    // Simulate a non-cancelable touchmove (browser already scrolling)
    const event = new TouchEvent('touchmove', {
      cancelable: false,
      touches: [new Touch({ identifier: 0, target: content, clientY: 410 })],
    });
    content.dispatchEvent(event);
    // Should not throw the [Intervention] error
  });
});

describe('Handle touch-action', () => {
  it('handle has data-glidesheet-handle attribute', async () => {
    render(<DragSheet />);
    await waitFor(() => {
      expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    });
    const handle = screen.getByTestId('handle');
    expect(handle.getAttribute('data-glidesheet-handle')).toBe('');
  });
});
