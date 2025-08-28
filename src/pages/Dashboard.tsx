import React from "react";
import {
  ActiveClipBoard,
  RecentHistory,
  Header,
  StatusBar,
} from "@/components/layout/index";
import UpgradeCard from "@/components/layout/UpgradeCard";
const Dashboard: React.FC = React.memo(() => {
  // const { recentItems } = useOptimizedClipboard();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <StatusBar />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ActiveClipBoard />
          <RecentHistory maxItems={10} />
        </div>
        <UpgradeCard />
      </main>
      <p className="mt-6 text-center text-sm text-gray-500">
        © 2025 PasteBoard. All rights reserved.
      </p>
    </div>
  );
});

export default Dashboard;
// import ActiveClipBoard from "@/components/layout/ActiveClipBoard";
// import Header from "@/components/layout/Header";
// import RecentHistory from "@/components/layout/RecentHistory";
// import StatusBar from "@/components/layout/StatusBar";
// import UpgradeCard from "@/components/layout/UpgradeCard";
// import { useUser } from "@/hooks/useAuth";
// import { useState } from "react";
// const Dashboard = () => {
//   const { user } = useUser();
//   const [refreshTrigger, setRefreshTrigger] = useState(0);
//   const handleClipboardUpdate = () => {
//     setRefreshTrigger(Date.now());
//   };
//   return (
//     <>
//       <Header />
//       <StatusBar user={user} />
//       <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 py-2 mt-5">
//         <ActiveClipBoard onClipboardUpdate={handleClipboardUpdate} />
//         <RecentHistory
//           user={
//             user ? { id: user.id, email: user.email, name: user.name } : null
//           }
//           refreshTrigger={refreshTrigger}
//         />
//       </div>
//       <UpgradeCard />
//       <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500">
//         © 2025 PasteBoard. All rights reserved.
//       </p>
//     </>
//   );
// };

// export default Dashboard;
