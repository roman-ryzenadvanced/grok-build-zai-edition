"use client";
import { useState, useEffect } from "react";

export function useCwd() {
  const [cwd, setCwd] = useState("/home/roman");

  useEffect(() => {
    // Default to home directory
    setCwd("/home/roman");
  }, []);

  return { cwd, setCwd };
}
