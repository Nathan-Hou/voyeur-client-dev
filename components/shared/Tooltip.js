export const Tooltip = ({ children, text }) => {
    return (
      <div className="relative group inline-block">
        {children}
        <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-sm rounded py-1 px-2 bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-48">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    );
};  