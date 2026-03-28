import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="py-10">
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="panel-title">Not Found</div>
          <h1 className="text-4xl font-bold text-white">404</h1>
          <p className="text-xs text-gray-400">
            The requested page does not exist.
          </p>
          <Link to="/series">
            <Button>Go to series</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
