import React from "react";
import clsx from "clsx";

const SearchInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...rest }) => (
  <input
    type="search"
    className={clsx(
      "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
      className
    )}
    placeholder="Search..."
    {...rest}
  />
);

export default SearchInput;
