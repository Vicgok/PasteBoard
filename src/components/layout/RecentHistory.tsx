import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/shadcn_ui/card";

import { Badge } from "@/components/shadcn_ui/badge";
import { Clipboard } from "lucide-react";
import { Button } from "@/components/shadcn_ui/button";
import { ScrollArea } from "@/components/shadcn_ui/scroll-area";

const RecentHistory = () => {
  const history = [
    {
      type: "OTP",
      value: "123456",
      time: "2 min ago",
      color: "from-indigo-100 to-indigo-50",
    },
    {
      type: "Text",
      value: "Meeting notes from today's standup...",
      time: "15 min ago",
      color: "from-green-100 to-green-50",
    },
    {
      type: "URL",
      value: "https://github.com/user/repo",
      time: "1 hour ago",
      color: "from-orange-100 to-orange-50",
    },
    {
      type: "Code",
      value: "const handleClick = () => {...}",
      time: "2 hours ago",
      color: "from-purple-100 to-purple-50",
    },
    {
      type: "Email",
      value: "john.doe@example.com",
      time: "3 hours ago",
      color: "from-yellow-100 to-yellow-50",
    },
  ];
  return (
    <Card className="shadow-md rounded-2xl flex flex-col justify-between h-full p-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          Recent History
        </CardTitle>
        <Button variant="link" className="text-xs text-blue-500">
          View All
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <ScrollArea className="h-[450px] pr-2">
          <div className="space-y-3">
            {history.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border bg-gradient-to-r ${item.color} flex items-center justify-between`}
              >
                <div>
                  <Badge className="text-xs mb-1" variant={"secondary"}>
                    {item.type}
                  </Badge>
                  <div className="text-sm">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.time}</div>
                </div>
                <Clipboard className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentHistory;
