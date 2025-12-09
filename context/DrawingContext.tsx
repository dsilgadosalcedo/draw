"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface DrawingContextType {
  currentDrawingId: string | null;
  setCurrentDrawingId: (id: string | null) => void;
}

const DrawingContext = createContext<DrawingContextType | undefined>(
  undefined,
);

export const DrawingProvider = ({ children }: { children: ReactNode }) => {
  const [currentDrawingId, setCurrentDrawingId] = useState<string | null>(
    null,
  );

  return (
    <DrawingContext.Provider value={{ currentDrawingId, setCurrentDrawingId }}>
      {children}
    </DrawingContext.Provider>
  );
};

export const useDrawing = () => {
  const context = useContext(DrawingContext);
  if (context === undefined) {
    throw new Error("useDrawing must be used within a DrawingProvider");
  }
  return context;
};

