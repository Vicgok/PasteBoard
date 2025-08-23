const AppLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-gradient-to-b ">
      <main className="container mx-auto px-4 py-2">{children}</main>
    </div>
  );
};

export default AppLayoutWrapper;
