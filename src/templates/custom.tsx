import type { CustomParams } from "../timeline/types";

/**
 * Episode-specific scenes that no template covers (e.g. a drug binding a
 * receptor). Build them ONLY from library components (MedicalStage,
 * SubjectView, FlowParticles, Vessel, Arrow3D, Callouts, cards) and register
 * them here by name. When a custom scene proves reusable, promote it to a
 * template in src/templates/.
 */
export const customScenes: Record<string, React.FC<{ params: CustomParams }>> = {};
