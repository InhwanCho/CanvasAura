'use client';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation"
import { ChangeEvent, useEffect, useState } from "react";
import qs from "query-string"

// Custom debounce hook
export const useDebounce = <T,>(value: T, delay?: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};


export default function SearchInput() {
  const router = useRouter();
  const [value, setValue] = useState<string>('');
  const debouncedValue = useDebounce<string>(value, 500);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  useEffect(() => {
    const url = qs.stringifyUrl({
      url: "/",
      query: {
        search: debouncedValue,
      }
    }, { skipEmptyString: true, skipNull: true });
    router.push(url);
  }, [debouncedValue, router]);

  return (
    <div className="w-[300px] lg:w-[600px] relative">
      <Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        className="w-full max-w-[516px] pl-9"
        placeholder="search ..."
        onChange={handleChange}
        value={value}
      />
    </div>
  )
}
