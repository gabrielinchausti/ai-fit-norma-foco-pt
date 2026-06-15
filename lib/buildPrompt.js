import fs from "fs";
import path from "path";

export function buildJoaoPrompt(profileId) {

  const templatePath = path.join(process.cwd(), "prompts", "joao_template.txt");
  const profilesPath = path.join(process.cwd(), "prompts", "assistant_profiles.json");

  const template = fs.readFileSync(templatePath, "utf8");
  const profiles = JSON.parse(fs.readFileSync(profilesPath, "utf8"));

  const profile = profiles.find(p => p.assistant_id === profileId);

  if (!profile) {
    throw new Error("Perfil no encontrado: " + profileId);
  }

  let prompt = template
    .replace("{assistant_description}", profile.assistant_description)
    .replace("{assistant_sensitivity}", profile.assistant_sensitivity);

  return prompt;
}