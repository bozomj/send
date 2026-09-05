import { ReactElement } from "react";
import { HeadLayout } from "./HeadLayout";

interface MainLayoutProps {
  children: ReactElement;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="bg-gray-100 text-slate-800 h-screen overflow-hidden">
      <HeadLayout />
      {children}
    </div>
  );
}
