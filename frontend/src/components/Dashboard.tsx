export function Dashboard() {
  return (
    <div className="flex h-screen bg-[#F9FBFC] items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Big + Icon */}
        <div className="text-gray-400">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M60 10V110M10 60H110"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Caption */}
        <p className="text-gray-600 text-lg font-medium text-center max-w-sm">
          Sync with device to get started
        </p>
      </div>
    </div>
  );
}
