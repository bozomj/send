import { ReactElement } from "react";

interface MainLayoutProps {
  children: ReactElement;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="bg-gray-100 text-slate-800 h-screen overflow-hidden">
      {children}
    </div>
  );
}
