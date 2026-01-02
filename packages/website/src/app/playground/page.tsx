import { Language, Playground, samples } from '@/components/playground';

export default function PlaygroundPage() {
  return (
    <Playground
      initialContent={samples.ts}
      initialLanguage={Language.TYPESCRIPT}
    />
  );
}
