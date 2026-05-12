import { forwardRef, type HTMLAttributes } from 'react';

export const Footer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Footer(props, ref) {
    return <div ref={ref} data-glidesheet-footer="" {...props} />;
  },
);
