import { activityApi } from "@/api/activityApi";

export const activityService = {
  list: () => activityApi.list()
};
