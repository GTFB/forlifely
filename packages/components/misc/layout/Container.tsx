import { LAYOUT_CONFIG } from "@/settings";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { containerWidth } = LAYOUT_CONFIG;

  return (
    <div
      className={`mx-auto w-full px-4 ${className ?? ""}`.trim()}
      style={{ maxWidth: containerWidth }}
    >
      {children}
    </div>
  );
}
