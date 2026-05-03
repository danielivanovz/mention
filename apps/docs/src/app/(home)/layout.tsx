import { HomeNav } from "@/components/home-nav";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      <HomeNav />
      <main className="flex-1">{children}</main>
    </>
  );
}
