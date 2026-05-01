import { Card, CardContent } from "@/components/ui/card";

export default function FeatureCard({ title, description }) {
  return (
    <Card className="friday-feature-card">
      <CardContent className="p-5">
        <div className="mb-4 h-1.5 w-12 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" />
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}
