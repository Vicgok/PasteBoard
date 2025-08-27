import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/shadcn_ui/dropdown-menu";
import { LogOut, User, CreditCard } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import Logo from "../custom_ui/Logo";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import HamburgerSVG from "../custom_ui/HamBurgerSVG";
import { Skeleton } from "../shadcn_ui/skeleton";

const Header = () => {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState("");
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.log("Error fetching profile:", authError);
        return;
      }
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        if (data) {
          setAvatar(data.avatar_url);
        }
      }
    };
    fetchProfile();
  }, []);
  const handleLogout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Logo />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-900">PasteBoard</h1>
            <p className="text-xs text-gray-500">Cross-device clipboard</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative">
              <button className="flex items-center gap-3 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20 group">
                {/* <Avatar>
                <AvatarImage
                  src={avatar}
                  alt="@shadcn"
                  className="h-10 w-10 object-cover rounded-full"
                />
                <AvatarFallback>
                  <Logo />
                </AvatarFallback>
              </Avatar> */}
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={avatar}
                    alt="User Avatar"
                    className="h-10 w-10 object-cover rounded-full"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </AvatarFallback>
                </Avatar>
                <div className="p-2 transition-transform duration-300 group-hover:rotate-90 transform origin-center">
                  <HamburgerSVG />
                </div>
              </button>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate("/account")}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate("/subscription")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Subscription</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
