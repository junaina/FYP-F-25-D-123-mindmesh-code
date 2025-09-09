import { Button } from "@/components/ui/button";
export default function Hero() {
  return (
    <section className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center md:py-32">
      <h1 className="text-4xl font-bold md:text-5xl">
        the <span className="italic">productivity</span> app<br></br> that
        adapts to{" "}
        <span className="italic" style={{ color: "var(--accent)" }}>
          you
        </span>
      </h1>
      <div className="mt-10">
        <Button className=" h-11 rounded-xl px-8 text-base " variant="outline">
          Sign Up
        </Button>
      </div>
    </section>
  );
}
