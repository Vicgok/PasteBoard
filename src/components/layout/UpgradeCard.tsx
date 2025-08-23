import { Card, CardContent } from "@/components/shadcn_ui/card";
import { Button } from "@/components/shadcn_ui/button";
import { Sparkles } from "lucide-react";

const UpgradeCard = () => {
  return (
    <Card className="mt-6 border-none shadow-sm bg-muted/30">
      <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between p-4 md:p-6 gap-6">
        {/* Left section */}
        <div className="flex items-start gap-3 w-full md:w-auto">
          {/* Plan badge */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 font-semibold shrink-0">
            F
          </div>
          <div>
            <h4 className="font-semibold">Free Plan</h4>
            <p className="text-sm text-muted-foreground">
              2 devices • 10 history items
            </p>
            <div className="flex flex-wrap gap-3 mt-1 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                ● Basic sync
              </span>
              <span className="flex items-center gap-1 text-yellow-600">
                ● Limited storage
              </span>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex flex-col md:flex-row md:gap-4 items-center  w-full md:w-auto">
          <div className="flex flex-col items-center md:items-end">
            <h4 className="font-semibold">Upgrade to Pro</h4>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              Unlimited everything • $4.99/mo
            </p>
          </div>
          <Button className="mt-2 bg-purple-500 hover:bg-purple-600 text-white w-full md:w-auto">
            <Sparkles className="mr-2 h-4 w-4" /> Upgrade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpgradeCard;
