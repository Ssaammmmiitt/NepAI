import './PageWrapper.css';

interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  return <main className="page-wrapper">{children}</main>;
}
