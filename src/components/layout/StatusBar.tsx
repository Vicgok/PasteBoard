import React from "react";
import { useAuthStore } from "@/stores/authStore";

const StatusBar: React.FC = React.memo(() => {
  const { user, profile } = useAuthStore();

  const displayName = profile?.name || user?.email || "User";

  return (
    <div className="container mx-auto flex items-center justify-between py-2">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-sm font-medium text-green-700">
          Hey {displayName}!
        </span>
      </div>
    </div>
  );
});

StatusBar.displayName = "StatusBar";

export default StatusBar;
// interface StatusBarProps {
//   user: { id: string; email: string; name?: string } | null;
// }

// const StatusBar: React.FC<StatusBarProps> = ({ user }) => {
//   return (
//     <div className="container mx-auto flex items-center justify-between py-2">
//       <div className="flex items-center space-x-2">
//         <div className="w-2 h-2 rounded-full bg-green-500"></div>
//         <span className="text-sm font-medium text-green-700">
//           Hey {user?.name || user?.email}!
//         </span>
//       </div>
//     </div>
//   );
// };

// export default StatusBar;
