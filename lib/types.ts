export type Player = {
  id: string;
  username: string;
  current_theme: string | null;
  cognitive_tags: string[];
  is_banned: boolean;
  created_at: string;
};

export type Artifact = {
  id: string;
  player_id: string;
  name: string;
  description: string | null;
  is_curiosity_key: boolean;
  created_at: string;
};

export type ArtifactAward = {
  name: string;
  desc: string;
  unlocks_action: string | null;
};

export type CognitiveTagUpdates = {
  add: string[];
  remove: string[];
};

export type GameNode = {
  narrative_text: string;
  image_prompt: string;
  buttons: string[];
  artifact_awarded: ArtifactAward | null;
  cognitive_tag_updates: CognitiveTagUpdates;
};
