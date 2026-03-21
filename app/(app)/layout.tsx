import Providers from "../../components/layout/Providers";
import BottomNav from "../../components/layout/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-bg pb-24">
        {children}
        <BottomNav />
      </div>
    </Providers>
  );
}
