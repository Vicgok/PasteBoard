const StatusBar = () => {
  return (
    <div className="container mx-auto flex items-center justify-between py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-green-700">
              All synced
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="text-lg">📱</span>
            <span className="text-sm">Pixel 10 pro</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-500">Last sync: 2 min ago</div>
    </div>
  );
};

export default StatusBar;
