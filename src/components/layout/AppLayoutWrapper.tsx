import Header from './Header';

const AppLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Header />
      <main>{children}</main>
    </div>
  );
};

export default AppLayoutWrapper;
