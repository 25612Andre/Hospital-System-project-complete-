import React, { useEffect, useState } from "react";
import SearchInput from "./SearchInput";

interface Props {
  onSearch: (term: string, filters: { type: string; sort: string }) => void;
}

const GlobalSearchBar: React.FC<Props> = ({ onSearch }) => {
  const [term, setTerm] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("asc");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (term.trim()) {
        onSearch(term, { type, sort });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [term, type, sort, onSearch]);

  return (
    <div className="flex gap-2 items-center rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-sm">
      <select
        className="text-xs bg-slate-50 border-r pr-2 focus:outline-none text-slate-600"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="all">All</option>
        <option value="patients">Patients</option>
        <option value="doctors">Doctors</option>
        <option value="appointments">Appointments</option>
        <option value="bills">Bills</option>
      </select>

      <SearchInput
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search..."
        className="border-none focus:ring-0 px-0 w-32 focus:w-48 transition-all"
      />

      <select
        className="text-xs bg-slate-50 border-l pl-2 focus:outline-none text-slate-600 max-w-[4rem]"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        <option value="asc">A-Z</option>
        <option value="desc">Z-A</option>
      </select>
    </div>
  );
};

export default GlobalSearchBar;
