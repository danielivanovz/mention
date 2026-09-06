export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <main id="main-content" className="flex-1">
      {children}
    </main>
  );
}
