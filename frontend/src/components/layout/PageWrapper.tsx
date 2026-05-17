interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  return <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-4rem)]">{children}</main>;
}
