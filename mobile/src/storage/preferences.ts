import { Preferences } from "@capacitor/preferences";

export async function readPref(key: string): Promise<string | null> {
  const { value } = await Preferences.get({ key });
  return value;
}

export async function writePref(key: string, value: string | null): Promise<void> {
  if (value === null) {
    await Preferences.remove({ key });
    return;
  }
  await Preferences.set({ key, value });
}
