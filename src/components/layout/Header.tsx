import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <p>PB</p>
          <p>Pasteboard</p>
        </div>
        <div>
          <Avatar>
            <AvatarImage
              src="https://github.com/shadcn.png"
              alt="@shadcn"
              className="h-10 w-10 rounded-full"
            />
            <AvatarFallback>PB</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
