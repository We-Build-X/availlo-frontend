import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { Input } from "#/components/ui/input";

export default function Home() {
  return (
    <div className="p-5">
      <Card className="w-full md:w-100">
        <h3>Welcome Home!</h3>
        <Input placeholder="Hellow World" />
        <Button>Hello World</Button>
      </Card>
    </div>
  );
}
