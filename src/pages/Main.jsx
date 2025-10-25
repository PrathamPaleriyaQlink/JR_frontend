import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowUpRightIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Main = () => {
  return (
    <div className="w-full h-[100svh] flex flex-col items-center justify-center gap-5">
      <div className="text-3xl font-semibold">Clara - JR</div>
      <div className="my-10 space-y-3">
        <div className="w-64">
          <Link to="/user">
            <Button size="lg" variant="outline" className="w-full">
              User Mode
            </Button>
          </Link>
        </div>

        <div>
          <Link to="/admin">
            <Button size="lg" className="w-full">
              Admin Mode
            </Button>
          </Link>
        </div>
      </div>
      <div className="fixed bottom-5 text-sm text-gray-500">v 0.3.1</div>
    </div>
  );
};

export default Main;
