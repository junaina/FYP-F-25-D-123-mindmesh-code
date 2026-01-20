import { UpdatePrefsZ, type UpdatePrefsInput } from "../dto/preferences.dto";
import * as Repo from "../repo/user-prefs.repo";

export const prefsService = {
  async getForUser(userId: string) {
    return Repo.getByUserId(userId);
  },

  async updateForUser(userId: string, data: UpdatePrefsInput) {
    // validate shape
    const input = UpdatePrefsZ.parse(data);

    await Repo.getByUserId(userId);

    return Repo.updateByUserId(userId, input);
  },
};
