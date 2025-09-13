export type StepId = 1 | 2 | 3 | 4 | 5; //only 5 steps
export type StepBaseProps = {
  onNext: () => void;
  onBack?: () => void; //? for first step
}; //this tells ts to expect these props in every step component
export type StepConfig = {
  id: StepId;
  title: React.ReactNode;
  subtitle?: React.ReactNode; //using React.ReactNode for occasional bold, spans, or custom formatting in subtitles.
  mascot: { src: string; alt: string };
};
