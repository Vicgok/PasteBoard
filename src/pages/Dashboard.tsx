import ActiveClipBoard from "@/components/layout/ActiveClipBoard";
import Header from "@/components/layout/Header";
import RecentHistory from "@/components/layout/RecentHistory";
import StatusBar from "@/components/layout/StatusBar";
import UpgradeCard from "@/components/layout/UpgradeCard";

const Dashboard = () => {
  return (
    <>
      <Header />
      <StatusBar />
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
        <ActiveClipBoard />
        <RecentHistory />
      </div>
      <UpgradeCard />
    </>
  );
};

export default Dashboard;
