import { type ReactNode } from "react";

export function Note({
  children,
  title = "Source notes",
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <details className="pl-note">
      <summary>
        {title}
        <span aria-hidden="true">+</span>
      </summary>
      <div>{children}</div>
    </details>
  );
}
