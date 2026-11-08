import type { Scene } from "../timeline/types";
import { CompareScene, ConceptScene, QuizScene, RecapScene } from "./Cards";
import { customScenes } from "./custom";
import { AnatomyScene, CrossSectionScene, FlowScene, HookScene, MicroScene } from "./Stage3D";

/** Renders one episode scene with the right template. */
export const SceneRenderer: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.template) {
    case "hook":
      return <HookScene params={scene.params} />;
    case "anatomy":
      return <AnatomyScene params={scene.params} />;
    case "flow":
      return <FlowScene params={scene.params} />;
    case "micro":
      return <MicroScene params={scene.params} />;
    case "crossSection":
      return <CrossSectionScene params={scene.params} />;
    case "concept":
      return <ConceptScene params={scene.params} />;
    case "compare":
      return <CompareScene params={scene.params} />;
    case "quiz":
      return <QuizScene params={scene.params} />;
    case "recap":
      return <RecapScene params={scene.params} />;
    case "custom": {
      const C = customScenes[scene.params.component];
      if (!C) throw new Error(`Unknown custom scene "${scene.params.component}". Register it in src/templates/custom.tsx`);
      return <C params={scene.params} />;
    }
  }
};
