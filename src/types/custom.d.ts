// Declarations for modules lacking TypeScript definitions
declare module "lucide-react" {
  import * as React from "react";
  export const UserPlus: React.FC<any>;
  export const Save: React.FC<any>;
  export const AlertCircle: React.FC<any>;
  export const ChevronDown: React.FC<any>;
  export const ChevronUp: React.FC<any>;
  export const CheckSquare: React.FC<any>;
  export const Square: React.FC<any>;
  export const Info: React.FC<any>;
  // Add other icons as needed
}

declare module "sonner" {
  import * as React from "react";
  export const toast: {
    success(message: string, options?: any): void;
    error(message: string, options?: any): void;
    info(message: string, options?: any): void;
  };
  export const Toaster: React.FC<any>;
}
